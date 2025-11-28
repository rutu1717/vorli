# Run Backend Server with Gemini API Key
# Usage: .\run-server.ps1 YOUR_API_KEY_HERE

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$env:GEMINI_API_KEY = $ApiKey
Write-Host "Starting server with API key..." -ForegroundColor Green
go run main.go
