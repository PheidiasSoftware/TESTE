<#
.SYNOPSIS
  Starts the TESTE local code LLM backend on Windows.

.DESCRIPTION
  Lightweight helper for weak PCs with 8 GB RAM and no GPU.
  It checks that the command is being executed from the repository root,
  verifies Node.js 20+, checks whether Ollama is reachable, prints
  conservative defaults, and starts the Node.js backend without installing
  heavy dependencies.

.NOTES
  Run from the repository root:
    powershell -ExecutionPolicy Bypass -File scripts/start-windows.ps1
#>

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path "package.json" -PathType Leaf)) {
  throw "package.json not found. Run this script from the repository root."
}

if (-not (Test-Path -Path "src/server.js" -PathType Leaf)) {
  throw "src/server.js not found. Run this script from the repository root."
}

$NodeVersionRaw = node -p "process.versions.node"
$NodeMajorVersion = [int]($NodeVersionRaw.Split('.')[0])

if ($NodeMajorVersion -lt 20) {
  throw "Node.js 20+ is required. Current version: $NodeVersionRaw"
}

if (-not $env:HOST) { $env:HOST = "127.0.0.1" }
if (-not $env:PORT) { $env:PORT = "3131" }
if (-not $env:OLLAMA_URL) { $env:OLLAMA_URL = "http://127.0.0.1:11434" }
if (-not $env:MODEL) { $env:MODEL = "qwen2.5-coder:1.5b-instruct" }
if (-not $env:MAX_BODY_BYTES) { $env:MAX_BODY_BYTES = "65536" }
if (-not $env:REQUEST_TIMEOUT_MS) { $env:REQUEST_TIMEOUT_MS = "120000" }
if (-not $env:GENERATION_CONCURRENCY) { $env:GENERATION_CONCURRENCY = "1" }
if (-not $env:MAX_QUEUE_SIZE) { $env:MAX_QUEUE_SIZE = "4" }
if (-not $env:ENABLE_PROMPT_CACHE) { $env:ENABLE_PROMPT_CACHE = "true" }
if (-not $env:MAX_CACHE_ENTRIES) { $env:MAX_CACHE_ENTRIES = "20" }
if (-not $env:MAX_CONTEXT_FILES) { $env:MAX_CONTEXT_FILES = "4" }
if (-not $env:MAX_CONTEXT_BYTES) { $env:MAX_CONTEXT_BYTES = "12000" }
if (-not $env:MAX_FILE_READ_BYTES) { $env:MAX_FILE_READ_BYTES = "32768" }
if (-not $env:ENABLE_RATE_LIMIT) { $env:ENABLE_RATE_LIMIT = "true" }
if (-not $env:RATE_LIMIT_WINDOW_MS) { $env:RATE_LIMIT_WINDOW_MS = "60000" }
if (-not $env:RATE_LIMIT_MAX_REQUESTS) { $env:RATE_LIMIT_MAX_REQUESTS = "30" }
if (-not $env:RATE_LIMIT_MAX_CLIENTS) { $env:RATE_LIMIT_MAX_CLIENTS = "500" }
if (-not $env:TRUST_PROXY) { $env:TRUST_PROXY = "false" }
if (-not $env:LOG_LEVEL) { $env:LOG_LEVEL = "info" }

Write-Host "TESTE Local Code LLM Backend" -ForegroundColor Cyan
Write-Host "Node.js: $NodeVersionRaw"
Write-Host "Host: $env:HOST"
Write-Host "Port: $env:PORT"
Write-Host "Ollama URL: $env:OLLAMA_URL"
Write-Host "Model: $env:MODEL"
Write-Host "Max body bytes: $env:MAX_BODY_BYTES"
Write-Host "Request timeout ms: $env:REQUEST_TIMEOUT_MS"
Write-Host "Generation concurrency: $env:GENERATION_CONCURRENCY"
Write-Host "Max queue size: $env:MAX_QUEUE_SIZE"
Write-Host "Prompt cache: $env:ENABLE_PROMPT_CACHE / max entries $env:MAX_CACHE_ENTRIES"
Write-Host "Context files: max $env:MAX_CONTEXT_FILES / max bytes $env:MAX_CONTEXT_BYTES"
Write-Host "Max file read bytes: $env:MAX_FILE_READ_BYTES"
Write-Host "Rate limit: $env:ENABLE_RATE_LIMIT / $env:RATE_LIMIT_MAX_REQUESTS requests per $env:RATE_LIMIT_WINDOW_MS ms / max clients $env:RATE_LIMIT_MAX_CLIENTS"
Write-Host "Trust proxy: $env:TRUST_PROXY"
Write-Host "Log level: $env:LOG_LEVEL"
Write-Host ""

try {
  $healthUrl = "$env:OLLAMA_URL/api/tags"
  Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 3 | Out-Null
  Write-Host "Ollama is reachable." -ForegroundColor Green
} catch {
  Write-Warning "Ollama did not respond at $env:OLLAMA_URL. Start Ollama before using /api/generate."
  Write-Host "Suggested model install: ollama pull $env:MODEL"
}

Write-Host ""
Write-Host "Starting backend. Press Ctrl+C to stop." -ForegroundColor Cyan
node src/server.js
