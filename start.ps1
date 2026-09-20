$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "TerraMind AI - starting..." -ForegroundColor Cyan

function Pause-Exit([int]$code) {
  Read-Host "Press Enter to close"
  exit $code
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[ERROR] Node.js is not installed. Install it from https://nodejs.org" -ForegroundColor Red
  Pause-Exit 1
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host "[SETUP] pnpm not found, installing it..."
npm install -g pnpm
}

try {
  if (-not (Test-Path "$PSScriptRoot\node_modules")) {
    Write-Host "[SETUP] Installing project dependencies, first run only..."
pnpm install
  }

  if (-not (Test-Path "$PSScriptRoot\.env")) {
    Write-Host "[SETUP] Creating .env from example..."
    pnpm setup
  }

  Start-Job -ScriptBlock { Start-Sleep -Seconds 8; Start-Process 'http://localhost:5173' } | Out-Null

  Write-Host ""
  Write-Host "Starting TerraMind AI..." -ForegroundColor Cyan
  Write-Host "  App: http://localhost:5173" -ForegroundColor Green
  Write-Host "  The app opens in your browser after a few seconds." -ForegroundColor Green
  Write-Host "  Press Ctrl+C to stop." -ForegroundColor Yellow
  Write-Host ""

  pnpm dev
}
catch {
  Write-Host ""
  Write-Host "Something went wrong:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Pause-Exit 1
}

Write-Host ""
Write-Host "TerraMind AI stopped." -ForegroundColor Cyan
Read-Host "Press Enter to close"