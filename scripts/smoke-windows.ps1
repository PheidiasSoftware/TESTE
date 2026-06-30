<#
.SYNOPSIS
  Runs lightweight HTTP smoke tests against a running TESTE backend on Windows.

.DESCRIPTION
  This script validates the local API contract without calling Ollama, downloading
  models, or executing generated code. Start the backend first with
  scripts/start-windows.ps1 or npm run start:windows, then run this smoke test.

.NOTES
  Run from the repository root:
    powershell -ExecutionPolicy Bypass -File scripts/smoke-windows.ps1
#>

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path "package.json" -PathType Leaf)) {
  throw "package.json not found. Run this script from the repository root."
}

if (-not $env:HOST) { $env:HOST = "127.0.0.1" }
if (-not $env:PORT) { $env:PORT = "3131" }

$BaseUrl = "http://$($env:HOST):$($env:PORT)"

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Method,

    [Parameter(Mandatory = $true)]
    [string]$Path,

    [string]$Body,

    [string]$ContentType = "application/json"
  )

  $uri = "$BaseUrl$Path"
  $params = @{
    Method = $Method
    Uri = $uri
    TimeoutSec = 10
  }

  if ($Body) {
    $params.Body = $Body
    $params.ContentType = $ContentType
  }

  try {
    $response = Invoke-WebRequest @params
    return [pscustomobject]@{
      StatusCode = [int]$response.StatusCode
      Body = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
      Headers = $response.Headers
    }
  } catch {
    $httpResponse = $_.Exception.Response
    if (-not $httpResponse) { throw }

    $reader = New-Object System.IO.StreamReader($httpResponse.GetResponseStream())
    $content = $reader.ReadToEnd()

    return [pscustomobject]@{
      StatusCode = [int]$httpResponse.StatusCode
      Body = if ($content) { $content | ConvertFrom-Json } else { $null }
      Headers = $httpResponse.Headers
    }
  }
}

function Assert-StatusCode {
  param(
    [Parameter(Mandatory = $true)]
    [object]$Result,

    [Parameter(Mandatory = $true)]
    [int]$Expected,

    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if ($Result.StatusCode -ne $Expected) {
    throw "$Name failed. Expected HTTP $Expected, got HTTP $($Result.StatusCode)."
  }

  Write-Host "OK - $Name ($Expected)" -ForegroundColor Green
}

Write-Host "TESTE API smoke tests" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "These checks do not call Ollama and do not execute generated code."
Write-Host ""

$health = Invoke-JsonRequest -Method "GET" -Path "/health"
Assert-StatusCode -Result $health -Expected 200 -Name "GET /health"
if ($health.Body.status -ne "ok") { throw "GET /health did not return status ok." }
if ($health.Body.ollama.endpoint -ne "redacted") { throw "GET /health exposed Ollama endpoint." }
if ($health.Body.PSObject.Properties.Name -contains "ollamaUrl") { throw "GET /health exposed ollamaUrl." }

$status = Invoke-JsonRequest -Method "GET" -Path "/api/status"
Assert-StatusCode -Result $status -Expected 200 -Name "GET /api/status"
if ($status.Body.ollama.endpoint -ne "redacted") { throw "GET /api/status exposed Ollama endpoint." }
if ($status.Body.fileRead.PSObject.Properties.Name -contains "projectRoot") { throw "GET /api/status exposed projectRoot." }

$badContentType = Invoke-JsonRequest -Method "POST" -Path "/api/generate" -ContentType "text/plain" -Body "task=Gerar codigo"
Assert-StatusCode -Result $badContentType -Expected 415 -Name "POST /api/generate rejects text/plain"

$missingTask = Invoke-JsonRequest -Method "POST" -Path "/api/generate" -Body '{"language":"Node.js"}'
Assert-StatusCode -Result $missingTask -Expected 400 -Name "POST /api/generate validates task"

$largeTaskBody = '{"task":"Criar CRUD completo de clientes com rotas, service, repository e testes","language":"Node.js","contextFiles":["src/server.js","src/config.js","src/http.js","src/logger.js"],"targetFiles":["src/modules/customers/routes.js"]}'
$largeTask = Invoke-JsonRequest -Method "POST" -Path "/api/generate" -Body $largeTaskBody
Assert-StatusCode -Result $largeTask -Expected 422 -Name "POST /api/generate suggests large-code-plan"
if ($largeTask.Body.largeCodeSuggestion.recommendedEndpoint -ne "POST /api/large-code-plan") {
  throw "Large task response did not suggest POST /api/large-code-plan."
}

$planBody = '{"task":"Criar CRUD completo de clientes com testes","language":"Node.js","contextFiles":["src/server.js"],"targetFiles":["src/modules/customers/routes.js"]}'
$plan = Invoke-JsonRequest -Method "POST" -Path "/api/large-code-plan" -Body $planBody
Assert-StatusCode -Result $plan -Expected 200 -Name "POST /api/large-code-plan"
if ($plan.Body.mode -ne "chunked-large-code-generation") { throw "Large-code plan returned unexpected mode." }

$unsafeFile = Invoke-JsonRequest -Method "POST" -Path "/api/read-file" -Body '{"path":"../package.json"}'
Assert-StatusCode -Result $unsafeFile -Expected 403 -Name "POST /api/read-file blocks traversal"

$wrongMethod = Invoke-JsonRequest -Method "GET" -Path "/api/generate"
Assert-StatusCode -Result $wrongMethod -Expected 405 -Name "GET /api/generate returns method not allowed"

$unknownRoute = Invoke-JsonRequest -Method "GET" -Path "/api/desconhecida"
Assert-StatusCode -Result $unknownRoute -Expected 404 -Name "GET unknown route returns not found"

Write-Host ""
Write-Host "Smoke tests completed successfully." -ForegroundColor Green
