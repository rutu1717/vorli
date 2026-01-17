import { LANGUAGE_VERSIONS } from "./constants";

// Message types from Piston WebSocket API
export type PistonMessage = {
    type: "runtime" | "data" | "stage" | "exit" | "error";
    stream?: "stdout" | "stderr";
    stage?: string;
    data?: string;
    code?: number;
    signal?: string;
    message?: string;
    language?: string;
    version?: string;
};

// Callbacks for handling different events
export type ExecutionCallbacks = {
    onOutput: (text: string, isError: boolean) => void;
    onExit: (code: number) => void;
    onError: (message: string) => void;
    onReady: () => void;
};

/**
 * InteractiveExecutor - Manages WebSocket connection for interactive code execution
 * 
 * How it works:
 * 1. Creates WebSocket connection to your Go backend (ws://localhost:8080/ws/execute)
 * 2. Your backend proxies to Piston (ws://localhost:2000/api/v2/connect)
 * 3. Sends init message with code to start execution
 * 4. Receives output as it streams from the program
 * 5. Can send stdin input when program is waiting
 * 6. Cleans up when program exits
 */
export class InteractiveExecutor {
    private ws: WebSocket | null = null;
    private callbacks: ExecutionCallbacks;

    constructor(callbacks: ExecutionCallbacks) {
        this.callbacks = callbacks;
    }

    /**
     * Start code execution
     * @param code - The source code to execute
     * @param language - Programming language (e.g., "python", "cpp")
     */
    start(code: string, language: string): void {
        // Get version from constants
        const version = LANGUAGE_VERSIONS[language as keyof typeof LANGUAGE_VERSIONS];

        // Dynamic WebSocket endpoint - works for both local dev and production
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname === 'localhost' 
            ? 'localhost:8080' 
            : '52.66.246.154:8080';  // AWS EC2 backend
        const wsEndpoint = `${wsProtocol}//${wsHost}/ws/execute`;

        // Create WebSocket connection to your Go backend
        this.ws = new WebSocket(wsEndpoint);

        // When connection opens, send the init message immediately
        // (Piston has a 1-second timeout for init!)
        this.ws.onopen = () => {
            console.log("WebSocket connected, sending init...");

            const initMessage = {
                type: "init",
                language: language === "cpp" ? "c++" : language, // Piston uses "c++" not "cpp"
                version: version,
                files: [{ content: code }],
                run_timeout: 30000,      // 30 seconds to run (max allowed by Piston config)
                compile_timeout: 30000,   // 30 seconds to compile
            };

            this.ws?.send(JSON.stringify(initMessage));
        };

        // Handle incoming messages from Piston (through your backend)
        this.ws.onmessage = (event) => {
            const msg: PistonMessage = JSON.parse(event.data);
            console.log("Received:", msg);

            switch (msg.type) {
                case "runtime":
                    // Piston confirmed it's running our code
                    this.callbacks.onReady();
                    break;

                case "data":
                    // Output from the running program
                    if (msg.data) {
                        const isError = msg.stream === "stderr";
                        this.callbacks.onOutput(msg.data, isError);
                    }
                    break;

                case "exit":
                    // Program finished execution
                    this.callbacks.onExit(msg.code ?? 0);
                    break;

                case "error":
                    // Error from Piston
                    this.callbacks.onError(msg.message ?? "Unknown error");
                    break;

                case "stage":
                    // Stage change (compile, run) - just log it
                    console.log("Stage:", msg.stage);
                    break;
            }
        };

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.callbacks.onError("Connection failed");
        };

        this.ws.onclose = (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
            this.ws = null;
        };
    }

    /**
     * Send input to the running program's stdin
     * @param input - The input string (newline will be added automatically)
     */
    sendInput(input: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: "data",
                stream: "stdin",
                data: input + "\n"  // Programs expect newline at end of input
            };
            this.ws.send(JSON.stringify(message));
            console.log("Sent input:", input);
        } else {
            console.warn("Cannot send input: WebSocket not connected");
        }
    }

    /**
     * Stop the running program (sends SIGKILL)
     */
    stop(): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type: "signal",
                signal: 9  // SIGKILL
            };
            this.ws.send(JSON.stringify(message));
        }
        this.ws?.close();
        this.ws = null;
    }

    /**
     * Check if the executor is currently running
     */
    isRunning(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
