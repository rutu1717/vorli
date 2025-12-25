package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

// CppInitMessage represents the init message from frontend for C++
type CppInitMessage struct {
	Type    string `json:"type"`
	Code    string `json:"code,omitempty"`
	Version string `json:"version,omitempty"`
	Files   []struct {
		Content string `json:"content"`
	} `json:"files,omitempty"`
}

// CppDataMessage represents stdin data from frontend
type CppDataMessage struct {
	Type   string `json:"type"`
	Stream string `json:"stream,omitempty"`
	Data   string `json:"data,omitempty"`
	Signal int    `json:"signal,omitempty"`
}

// sendWSMessage sends a JSON message over websocket
func sendWSMessage(conn *websocket.Conn, msgType string, data map[string]interface{}) error {
	msg := map[string]interface{}{"type": msgType}
	for k, v := range data {
		msg[k] = v
	}
	return conn.WriteJSON(msg)
}

// wsCppExecuteHandler handles WebSocket connections for C++ with PTY
func wsCppExecuteHandler(w http.ResponseWriter, r *http.Request) {
	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer wsConn.Close()

	log.Println("C++ WebSocket connection established")

	// Create Docker client
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to connect to Docker"})
		return
	}
	defer cli.Close()

	// Wait for init message (1 second timeout like Piston)
	wsConn.SetReadDeadline(time.Now().Add(1 * time.Second))
	_, rawMsg, err := wsConn.ReadMessage()
	if err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Init timeout"})
		return
	}
	wsConn.SetReadDeadline(time.Time{}) // Remove deadline

	var initMsg CppInitMessage
	if err := json.Unmarshal(rawMsg, &initMsg); err != nil || initMsg.Type != "init" {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Invalid init message"})
		return
	}

	// Get code from files array (like Piston format)
	var code string
	if len(initMsg.Files) > 0 {
		code = initMsg.Files[0].Content
	}
	if code == "" {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "No code provided"})
		return
	}

	// Create temp directory for code
	tmpDir, err := os.MkdirTemp("", "cpp-exec-*")
	if err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to create temp directory"})
		return
	}
	defer os.RemoveAll(tmpDir)

	// Write code to file
	codePath := filepath.Join(tmpDir, "main.cpp")
	if err := os.WriteFile(codePath, []byte(code), 0644); err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to write code file"})
		return
	}

	// Send runtime message (like Piston)
	sendWSMessage(wsConn, "runtime", map[string]interface{}{
		"language": "c++",
		"version":  "10.2.0",
	})

	// === COMPILE STAGE ===
	sendWSMessage(wsConn, "stage", map[string]interface{}{"stage": "compile"})

	compileResp, err := cli.ContainerCreate(ctx, &container.Config{
		Image:      "cpp-runner",
		Cmd:        []string{"g++", "-o", "/code/main", "/code/main.cpp"},
		WorkingDir: "/code",
	}, &container.HostConfig{
		Binds: []string{tmpDir + ":/code"},
	}, nil, nil, "")
	if err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to create compile container"})
		return
	}

	if err := cli.ContainerStart(ctx, compileResp.ID, container.StartOptions{}); err != nil {
		cli.ContainerRemove(ctx, compileResp.ID, container.RemoveOptions{Force: true})
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to start compile container"})
		return
	}

	// Wait for compilation
	statusCh, errCh := cli.ContainerWait(ctx, compileResp.ID, container.WaitConditionNotRunning)
	var compileExitCode int64
	select {
	case err := <-errCh:
		if err != nil {
			cli.ContainerRemove(ctx, compileResp.ID, container.RemoveOptions{Force: true})
			sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Compile wait error"})
			return
		}
	case status := <-statusCh:
		compileExitCode = status.StatusCode
	}

	// Get compile output (errors if any)
	compileOut, err := cli.ContainerLogs(ctx, compileResp.ID, container.LogsOptions{ShowStdout: true, ShowStderr: true})
	if err == nil {
		compileOutput, _ := io.ReadAll(compileOut)
		if len(compileOutput) > 0 {
			// Strip docker log headers (first 8 bytes per line)
			cleanOutput := stripDockerLogHeaders(compileOutput)
			if len(cleanOutput) > 0 {
				sendWSMessage(wsConn, "data", map[string]interface{}{
					"stream": "stderr",
					"data":   string(cleanOutput),
				})
			}
		}
		compileOut.Close()
	}

	cli.ContainerRemove(ctx, compileResp.ID, container.RemoveOptions{Force: true})

	if compileExitCode != 0 {
		sendWSMessage(wsConn, "exit", map[string]interface{}{
			"stage": "compile",
			"code":  compileExitCode,
		})
		return
	}

	// === RUN STAGE (with TTY!) ===
	sendWSMessage(wsConn, "stage", map[string]interface{}{"stage": "run"})

	// Create run container WITH TTY - this is the key difference!
	runResp, err := cli.ContainerCreate(ctx, &container.Config{
		Image:        "cpp-runner",
		Cmd:          []string{"./main"},
		WorkingDir:   "/code",
		Tty:          true, // Enable TTY for interactive stdin
		OpenStdin:    true, // Keep stdin open
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
	}, &container.HostConfig{
		Binds: []string{tmpDir + ":/code"},
	}, nil, nil, "")
	if err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to create run container"})
		return
	}
	defer cli.ContainerRemove(ctx, runResp.ID, container.RemoveOptions{Force: true})

	// Attach to container for interactive I/O
	attachResp, err := cli.ContainerAttach(ctx, runResp.ID, container.AttachOptions{
		Stream: true,
		Stdin:  true,
		Stdout: true,
		Stderr: true,
	})
	if err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to attach to container"})
		return
	}
	defer attachResp.Close()

	// Start the container
	if err := cli.ContainerStart(ctx, runResp.ID, container.StartOptions{}); err != nil {
		sendWSMessage(wsConn, "error", map[string]interface{}{"message": "Failed to start run container"})
		return
	}

	var wg sync.WaitGroup
	stopChan := make(chan struct{})
	var closeOnce sync.Once
	closeStop := func() {
		closeOnce.Do(func() { close(stopChan) })
	}

	// Goroutine: Read stdout from container -> send to WebSocket
	wg.Add(1)
	go func() {
		defer wg.Done()
		buf := make([]byte, 1024)
		for {
			select {
			case <-stopChan:
				return
			default:
				n, err := attachResp.Reader.Read(buf)
				if err != nil {
					if err != io.EOF {
						log.Println("Container read error:", err)
					}
					return
				}
				if n > 0 {
					sendWSMessage(wsConn, "data", map[string]interface{}{
						"stream": "stdout",
						"data":   string(buf[:n]),
					})
				}
			}
		}
	}()

	// Goroutine: Read stdin from WebSocket -> send to container
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			select {
			case <-stopChan:
				return
			default:
				_, rawMsg, err := wsConn.ReadMessage()
				if err != nil {
					log.Println("WebSocket read error:", err)
					closeStop()
					return
				}

				var dataMsg CppDataMessage
				if err := json.Unmarshal(rawMsg, &dataMsg); err != nil {
					continue
				}

				switch dataMsg.Type {
				case "data":
					if dataMsg.Stream == "stdin" {
						attachResp.Conn.Write([]byte(dataMsg.Data))
					}
				case "signal":
					// Handle kill signal
					if dataMsg.Signal == 9 {
						cli.ContainerKill(ctx, runResp.ID, "SIGKILL")
						closeStop()
						return
					}
				}
			}
		}
	}()

	// Wait for container to finish
	statusCh, errCh = cli.ContainerWait(ctx, runResp.ID, container.WaitConditionNotRunning)
	var runExitCode int64 = 0
	select {
	case err := <-errCh:
		if err != nil {
			log.Println("Container wait error:", err)
		}
	case status := <-statusCh:
		runExitCode = status.StatusCode
	}

	closeStop()
	wg.Wait()

	sendWSMessage(wsConn, "exit", map[string]interface{}{
		"stage": "run",
		"code":  runExitCode,
	})

	log.Println("C++ execution completed with code:", runExitCode)
}

// stripDockerLogHeaders removes the 8-byte header Docker adds to log lines
func stripDockerLogHeaders(data []byte) []byte {
	var result []byte
	for len(data) > 0 {
		if len(data) < 8 {
			break
		}
		// Header format: [stream_type(1)][0][0][0][size(4)]
		size := int(data[4])<<24 | int(data[5])<<16 | int(data[6])<<8 | int(data[7])
		data = data[8:]
		if size > len(data) {
			size = len(data)
		}
		result = append(result, data[:size]...)
		data = data[size:]
	}
	return result
}
