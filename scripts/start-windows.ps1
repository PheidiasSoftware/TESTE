<#
.SYNOPSIS
  Starts the TESTE local code LLM backend on Windows.

.DESCRIPTION
  Lightweight helper for weak PCs with 8 GB RAM and no GPU.
  It checks whether Ollama is reachable, prints conservative defaults,
  and starts the Node.js backend without installing heavy dependencies.

.NOTES
  Run from the repository root:
    powershell -ExecutionPolicy Bypass -File scripts/start-windows.ps1
#>

$ErrorActionPreference = "Stop"

$HostName = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$Port = if ($env:PORT) { $env:PORT } else { "3131" }
$OllamaUrl = if ($env:OLLAMA_URL) { $env:OLLAMA_URL } else { "http://127.0.0.1:11434" }
$Model = if ($env:MODEL) { $env:MODEL } else { "qwen2.5-coder:1.5b-instruct" }

if (-not $env:GENERATION_CONCURRENCY) { $env:GENERATION_CONCURRENCY = "1" }
if (-not $env:MAX_QUEUE_SIZE) { $env:MAX_QUEUE_SIZE = "4" }
if (-not $env:ENABLE_PROMPT_CACHE) { $env:ENABLE_PROMPT_CACHE = "true" }
if (-not $env:MAX_CACHE_ENTRIES) { $env:MAX_CACHE_ENTRIES = "20" }

Write-Host "TESTE Local Code LLM Backend" -ForegroundColor Cyan
Write-Host "Host: $HostName"
Write-Host "Port: $Port"
Write-Host "Ollama URL: $OllamaUrl"
Write-Host "Model: $Model"
Write-Host "Generation concurrency: $env:GENERATION_CONCURRENCY"
Write-Host "Max queue size: $env:MAX_QUEUE_SIZE"
Write-Host "Prompt cache: $env:ENABLE_PROMPT_CACHE / max entries $env:MAX_CACHE_ENTRIES"
Write-Host ""

try {
  $healthUrl = "$OllamaUrl/api/tags"
  Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 3 | Out-Null
  Write-Host "Ollama is reachable." -ForegroundColor Green
} catch {
  Write-Warning "Ollama did not respond at $OllamaUrl. Start Ollama before using /api/generate."
  Write-Host "Suggested model install: ollama pull $Model"
}

Write-Host ""
Write-Host "Starting backend. Press Ctrl+C to stop." -ForegroundColor Cyan
node src/server.js
