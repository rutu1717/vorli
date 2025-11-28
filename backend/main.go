package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "google.golang.org/genai"
)

type CodeRequest struct {
    Code     string `json:"code"`
    Language string `json:"language"`
}

type CodeResponse struct {
    Analysis string `json:"analysis"`
    Error    string `json:"error,omitempty"`
}

// CORS middleware
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next(w, r)
    }
}

func analyzeCodeHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var req CodeRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        json.NewEncoder(w).Encode(CodeResponse{Error: "Invalid request body"})
        return
    }

    // Create Gemini client
    ctx := context.Background()
    apiKey := os.Getenv("GEMINI_API_KEY")
    if apiKey == "" {
        log.Printf("GEMINI_API_KEY environment variable not set")
        json.NewEncoder(w).Encode(CodeResponse{Error: "API key not configured. Please set GEMINI_API_KEY environment variable."})
        return
    }
    
    client, err := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey: apiKey,
    })
    if err != nil {
        log.Printf("Error creating client: %v", err)
        json.NewEncoder(w).Encode(CodeResponse{Error: "Failed to initialize AI client"})
        return
    }

    // Create prompt with user's code
    prompt := fmt.Sprintf("Analyze this %s code and explain how it works step by step. Include variable changes and execution flow:\n\n%s", req.Language, req.Code)

    // Get response from Gemini - using gemini-1.5-flash for better free tier availability
    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text(prompt),
        nil,
    )
    if err != nil {
        log.Printf("Error generating content: %v", err)
        json.NewEncoder(w).Encode(CodeResponse{Error: "Failed to analyze code. Please check your API quota."})
        return
    }

    // Send response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(CodeResponse{Analysis: result.Text()})
}

func main() {
    http.HandleFunc("/api/analyze", enableCORS(analyzeCodeHandler))
    
    port := ":8080"
    fmt.Printf("Server starting on port %s...\n", port)
    if err := http.ListenAndServe(port, nil); err != nil {
        log.Fatal(err)
    }
}