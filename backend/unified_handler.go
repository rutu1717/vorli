package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

// extractJavaClassName extracts the public class name from Java code
func extractJavaClassName(code string) string {
	re := regexp.MustCompile(`public\s+class\s+(\w+)`)
	matches := re.FindStringSubmatch(code)
	if len(matches) > 1 {
		return matches[1]
	}
	return "Main" // Default fallback
}

// Language configuration for compile and run commands
type LanguageConfig struct {
	Extension    string
	Image        string // Docker image to use
	NeedsCompile bool
	CompileCmd   func(filename string) []string
	RunCmd       func(filename string) []string
}

var languageConfigs = map[string]LanguageConfig{
	"cpp": {
		Extension:    "cpp",
		Image:        "code-runner", // Unified image with all languages
		NeedsCompile: true,
		CompileCmd:   func(f string) []string { return []string{"g++", "-o", "/code/main", "/code/" + f} },
		RunCmd:       func(f string) []string { return []string{"sh", "-c", "stty -echo && ./main"} },
	},
	"c++": {
		Extension:    "cpp",
		Image:        "code-runner",
		NeedsCompile: true,
		CompileCmd:   func(f string) []string { return []string{"g++", "-o", "/code/main", "/code/" + f} },
		RunCmd:       func(f string) []string { return []string{"sh", "-c", "stty -echo && ./main"} },
	},
	"java": {
		Extension:    "java",
		Image:        "code-runner",
		NeedsCompile: true,
		CompileCmd:   func(f string) []string { return []string{"javac", "/code/" + f} },
		// f is the filename like "UserInputProgram.java", we extract class name by removing .java
		RunCmd: func(f string) []string {
			className := f[:len(f)-5] // Remove ".java" extension
			return []string{"sh", "-c", "stty -echo && java -cp /code " + className}
		},
	},
	"python": {
		Extension:    "py",
		Image:        "code-runner",
		NeedsCompile: false,
		CompileCmd:   nil,
		RunCmd:       func(f string) []string { return []string{"sh", "-c", "stty -echo && python /code/" + f} },
	},
}

// InitMessage from frontend
type InitMessage struct {
	Type     string `json:"type"`
	Language string `json:"language"`
	Version  string `json:"version,omitempty"`
	Files    []struct {
		Content string `json:"content"`
	} `json:"files,omitempty"`
}

// DataMessage for stdin/signals
type DataMessage struct {
	Type   string `json:"type"`
	Stream string `json:"stream,omitempty"`
	Data   string `json:"data,omitempty"`
	Signal int    `json:"signal,omitempty"`
}

// sendMessage sends a JSON message over websocket
func sendMessage(conn *websocket.Conn, msgType string, data map[string]interface{}) error {
	msg := map[string]interface{}{"type": msgType}
	for k, v := range data {
		msg[k] = v
	}
	return conn.WriteJSON(msg)
}

// wsUnifiedExecuteHandler handles WebSocket connections for all languages with PTY
func wsUnifiedExecuteHandler(w http.ResponseWriter, r *http.Request) {
	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer wsConn.Close()

	log.Println("WebSocket connection established")

	// Create Docker client
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to connect to Docker"})
		return
	}
	defer cli.Close()

	// Wait for init message (1 second timeout)
	wsConn.SetReadDeadline(time.Now().Add(1 * time.Second))
	_, rawMsg, err := wsConn.ReadMessage()
	if err != nil {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Init timeout"})
		return
	}
	wsConn.SetReadDeadline(time.Time{})

	var initMsg InitMessage
	if err := json.Unmarshal(rawMsg, &initMsg); err != nil || initMsg.Type != "init" {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Invalid init message"})
		return
	}

	// Get language config
	langConfig, ok := languageConfigs[initMsg.Language]
	if !ok {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Unsupported language: " + initMsg.Language})
		return
	}

	// Get code from files array
	var code string
	if len(initMsg.Files) > 0 {
		code = initMsg.Files[0].Content
	}
	if code == "" {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "No code provided"})
		return
	}

	// Create temp directory for code
	tmpDir, err := os.MkdirTemp("", "code-exec-*")
	if err != nil {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to create temp directory"})
		return
	}
	defer os.RemoveAll(tmpDir)

	// Determine filename based on language
	var filename string
	var javaClassName string
	if initMsg.Language == "java" {
		javaClassName = extractJavaClassName(code)
		filename = javaClassName + ".java"
		log.Printf("Java class detected: %s, filename: %s", javaClassName, filename)
	} else {
		filename = "main." + langConfig.Extension
	}

	// Write code to file
	codePath := filepath.Join(tmpDir, filename)
	if err := os.WriteFile(codePath, []byte(code), 0644); err != nil {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to write code file"})
		return
	}

	// Send runtime message
	sendMessage(wsConn, "runtime", map[string]interface{}{
		"language": initMsg.Language,
		"version":  initMsg.Version,
	})

	// === COMPILE STAGE (if needed) ===
	if langConfig.NeedsCompile {
		sendMessage(wsConn, "stage", map[string]interface{}{"stage": "compile"})

		compileResp, err := cli.ContainerCreate(ctx, &container.Config{
			Image:      langConfig.Image,
			Cmd:        langConfig.CompileCmd(filename),
			WorkingDir: "/code",
		}, &container.HostConfig{
			Binds: []string{tmpDir + ":/code"},
		}, nil, nil, "")
		if err != nil {
			sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to create compile container"})
			return
		}

		if err := cli.ContainerStart(ctx, compileResp.ID, container.StartOptions{}); err != nil {
			cli.ContainerRemove(ctx, compileResp.ID, container.RemoveOptions{Force: true})
			sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to start compile container"})
			return
		}

		// Wait for compilation
		statusCh, errCh := cli.ContainerWait(ctx, compileResp.ID, container.WaitConditionNotRunning)
		var compileExitCode int64
		select {
		case err := <-errCh:
			if err != nil {
				cli.ContainerRemove(ctx, compileResp.ID, container.RemoveOptions{Force: true})
				sendMessage(wsConn, "error", map[string]interface{}{"message": "Compile wait error"})
				return
			}
		case status := <-statusCh:
			compileExitCode = status.StatusCode
		}

		// Get compile output
		compileOut, err := cli.ContainerLogs(ctx, compileResp.ID, container.LogsOptions{ShowStdout: true, ShowStderr: true})
		if err == nil {
			compileOutput, _ := io.ReadAll(compileOut)
			if len(compileOutput) > 0 {
				cleanOutput := stripLogHeaders(compileOutput)
				if len(cleanOutput) > 0 {
					sendMessage(wsConn, "data", map[string]interface{}{
						"stream": "stderr",
						"data":   string(cleanOutput),
					})
				}
			}
			compileOut.Close()
		}

		cli.ContainerRemove(ctx, compileResp.ID, container.RemoveOptions{Force: true})

		if compileExitCode != 0 {
			sendMessage(wsConn, "exit", map[string]interface{}{
				"stage": "compile",
				"code":  compileExitCode,
			})
			return
		}
	}

	// === RUN STAGE (with TTY!) ===
	sendMessage(wsConn, "stage", map[string]interface{}{"stage": "run"})

	runResp, err := cli.ContainerCreate(ctx, &container.Config{
		Image:        langConfig.Image,
		Cmd:          langConfig.RunCmd(filename),
		WorkingDir:   "/code",
		Tty:          true,
		OpenStdin:    true,
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
	}, &container.HostConfig{
		Binds: []string{tmpDir + ":/code"},
	}, nil, nil, "")
	if err != nil {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to create run container"})
		return
	}
	defer cli.ContainerRemove(ctx, runResp.ID, container.RemoveOptions{Force: true})

	// Attach to container
	attachResp, err := cli.ContainerAttach(ctx, runResp.ID, container.AttachOptions{
		Stream: true,
		Stdin:  true,
		Stdout: true,
		Stderr: true,
	})
	if err != nil {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to attach to container"})
		return
	}
	defer attachResp.Close()

	log.Println("Container attached, starting container...")

	// Start the container
	if err := cli.ContainerStart(ctx, runResp.ID, container.StartOptions{}); err != nil {
		sendMessage(wsConn, "error", map[string]interface{}{"message": "Failed to start run container"})
		return
	}

	log.Println("Container started, setting up I/O streaming...")

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
		log.Println("Starting stdout reader goroutine...")
		buf := make([]byte, 1024)
		for {
			select {
			case <-stopChan:
				log.Println("Stdout reader: stop signal received")
				return
			default:
				n, err := attachResp.Reader.Read(buf)
				if err != nil {
					if err != io.EOF {
						log.Println("Container read error:", err)
					} else {
						log.Println("Container EOF")
					}
					return
				}
				if n > 0 {
					log.Printf("Read %d bytes from container: %q", n, string(buf[:n]))
					sendMessage(wsConn, "data", map[string]interface{}{
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

				var dataMsg DataMessage
				if err := json.Unmarshal(rawMsg, &dataMsg); err != nil {
					continue
				}

				switch dataMsg.Type {
				case "data":
					if dataMsg.Stream == "stdin" {
						attachResp.Conn.Write([]byte(dataMsg.Data))
					}
				case "signal":
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
	statusCh, errCh := cli.ContainerWait(ctx, runResp.ID, container.WaitConditionNotRunning)
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

	sendMessage(wsConn, "exit", map[string]interface{}{
		"stage": "run",
		"code":  runExitCode,
	})

	log.Println("Execution completed with code:", runExitCode)
}

// stripLogHeaders removes Docker log headers
func stripLogHeaders(data []byte) []byte {
	var result []byte
	for len(data) > 0 {
		if len(data) < 8 {
			break
		}
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
