package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "github.com/joho/godotenv"
    "os"
    "google.golang.org/genai"
    "strings" // FIXED: Was missing

)
type AIAnalysis struct {
	Status          string   `json:"status"`           // "Correct", "Inefficient", "Buggy"
	TimeComplexity  string   `json:"time_complexity"`  // e.g., "O(N^2)"
	SpaceComplexity string   `json:"space_complexity"` // e.g., "O(1)"
	Summary         string   `json:"summary"`          // A 1-sentence headline
	DetailedReview  string   `json:"detailed_review"`  // The main explanation (Markdown supported)
	KeyTips         []string `json:"key_tips"`         // List of bullet points for improvements
}
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
    err := godotenv.Load()
    if err != nil {
        log.Printf("Error loading environment variables: %v", err)
    }
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
   // Define the system instructions separately to keep code clean
    const systemPrompt = `
You are a Senior Technical Interviewer. 
Analyze the student's code. 
Your response must be a strictly valid JSON object. 
Do not include markdown formatting (like '''json). 
Do not include any text outside the JSON object.

Follow this schema:
{
  "status": "One of: Correct, Inefficient, Incorrect",
  "time_complexity": "Big O notation",
  "space_complexity": "Big O notation",
  "summary": "A punchy, 10-word summary of the result",
  "detailed_review": "Your detailed mentorship feedback here. Use Markdown for bolding/code.",
  "key_tips": ["Tip 1", "Tip 2", "Tip 3"]
}
`
// Then append the user's code to this as before

// Construct the user prompt
userPrompt := fmt.Sprintf("Language: %s\n\nCode:\n%s\n\nAnalyze this code based on the instructions above.", req.Language, req.Code)

// If you use OpenAI/Gemini API, usually you send System and User messages separately. 
// If your API takes one big string, combine them:
fullPrompt := fmt.Sprintf("%s\n\n---\n\n%s", systemPrompt, userPrompt)

    // Get response from Gemini - using gemini-1.5-flash for better free tier availability
    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text(fullPrompt),
        nil,
    )
    if err != nil {
        log.Printf("Error generating content: %v", err)
        json.NewEncoder(w).Encode(CodeResponse{Error: "Failed to analyze code. Please check your API quota."})
        return
    }

    // Send response
    cleanResponse := strings.TrimSpace(result.Text())
    cleanResponse = strings.TrimPrefix(cleanResponse, "```json")
    cleanResponse = strings.TrimPrefix(cleanResponse, "```")
    cleanResponse = strings.TrimSuffix(cleanResponse, "```")

    // 3. Unmarshal (Parse) into your Struct
    var analysis AIAnalysis
    err = json.Unmarshal([]byte(cleanResponse), &analysis)
    if err != nil {
        log.Println("JSON Parse Error:", err)
        // Fallback: If parsing fails, just send the raw text in a generic wrapper
        analysis = AIAnalysis{
            Status: "Error Parsing",
            DetailedReview: cleanResponse,
        }
    }

    // 4. Send the STRUCT back to your frontend as JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(analysis)
}

func main() {
    http.HandleFunc("/api/analyze", enableCORS(analyzeCodeHandler))
    
    port := ":8080"
    fmt.Printf("Server starting on port %s...\n", port)
    if err := http.ListenAndServe(port, nil); err != nil {
        log.Fatal(err)
    }
}