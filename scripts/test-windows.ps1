<#
.SYNOPSIS
  Runs the TESTE backend offline test suite on Windows.

.DESCRIPTION
  Conservative validation helper for weak PCs with 8 GB RAM and no GPU.
  It configures safe local defaults and runs npm test without starting Ollama,
  downloading models, or executing generated code.

.NOTES
  Run from the repository root:
    powershell -ExecutionPolicy Bypass -File scripts/test-windows.ps1
#>

$ErrorActionPreference = "Stop"

if (-not $env:HOST) { $env:HOST = "127.0.0.1" }
if (-not $env:PORT) { $env:PORT = "3131" }
if (-not $env:OLLAMA_URL) { $env:OLLAMA_URL = "http://127.0.0.1:11434" }
if (-not $env:MODEL) { $env:MODEL = "qwen2.5-coder:1.5b-instruct" }
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
if (-not $env:LOG_LEVEL) { $env:LOG_LEVEL = "silent" }

Write-Host "TESTE backend offline validation" -ForegroundColor Cyan
Write-Host "Node tests only; Ollama/model execution is intentionally skipped."
Write-Host "Host: $env:HOST"
Write-Host "Port: $env:PORT"
Write-Host "Model config: $env:MODEL"
Write-Host "Generation concurrency: $env:GENERATION_CONCURRENCY"
Write-Host "Max queue size: $env:MAX_QUEUE_SIZE"
Write-Host "Max context files: $env:MAX_CONTEXT_FILES"
Write-Host "Max context bytes: $env:MAX_CONTEXT_BYTES"
Write-Host "Log level: $env:LOG_LEVEL"
Write-Host ""

npm test

Write-Host ""
Write-Host "Offline validation completed." -ForegroundColor Green
