# Test local automatise pour Outlook
# 1. Genere le cert si besoin
# 2. Lance Vite en HTTPS
# 3. Ouvre Outlook avec le manifeste local
# Usage: .\scripts\test-local.ps1

param(
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$tunnelDir = Join-Path $root "tunnel"
$logFile = Join-Path $tunnelDir "test-local.log"
$pidFile = Join-Path $tunnelDir "test-local.pid"

# Stop mode
if ($Stop) {
    if (Test-Path $pidFile) {
        $pid = Get-Content $pidFile
        Write-Host "Arret de Vite (PID $pid)..." -ForegroundColor Yellow
        Get-Process -Id $pid -ErrorAction SilentlyContinue | Stop-Process -Force
        Remove-Item $pidFile -Force
    }
    Get-Process -Name "node","mkcert" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*nodejs*" -or $_.MainWindowTitle -eq ""
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Arrete." -ForegroundColor Green
    exit 0
}

# Start mode
Write-Host "=== Test local Responder Assist ===" -ForegroundColor Cyan

# 1. Verifier les deps
if (-not (Test-Path "$root\node_modules")) {
    Write-Host "Installation des dependances..." -ForegroundColor Yellow
    Push-Location $root
    npm install | Out-Null
    Pop-Location
    Write-Host "OK" -ForegroundColor Green
}

# 2. Generer le cert si besoin
$certPath = Join-Path $tunnelDir "localhost.pem"
$keyPath = Join-Path $tunnelDir "localhost-key.pem"
if (-not (Test-Path $certPath) -or -not (Test-Path $keyPath)) {
    Write-Host "Generation du cert HTTPS..." -ForegroundColor Yellow
    $mkcert = Join-Path $tunnelDir "mkcert.exe"
    if (-not (Test-Path $mkcert)) {
        Write-Host "[ERREUR] mkcert introuvable : $mkcert" -ForegroundColor Red
        exit 1
    }
    # Install CA
    & $mkcert -install 2>&1 | Out-Null
    Set-Location $tunnelDir
    & $mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1 2>&1 | Out-Null
    Set-Location $root
    Write-Host "OK" -ForegroundColor Green
}

# 3. Verifier que le cert racine est dans Windows (pour Outlook)
Write-Host "Certificat racine : $((Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Subject -match "mkcert" }).Count) cert(s) mkcert trouves"

# 4. Lancer Vite en arriere-plan
Write-Host "Demarrage de Vite en HTTPS..." -ForegroundColor Yellow
if (Test-Path $logFile) { Remove-Item $logFile }
$proc = Start-Process -FilePath "npx.cmd" -ArgumentList "vite" `
    -WorkingDirectory $root `
    -RedirectStandardOutput $logFile `
    -RedirectStandardError "$logFile.err" `
    -PassThru -WindowStyle Hidden
$proc.Id | Set-Content $pidFile
Start-Sleep -Seconds 5

# 5. Tester l'accessibilite
[System.Net.ServicePointManager]::CertificatePolicy = New-Object System.Net.Net.ServicePointManager
add-type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class TrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
}
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

try {
    $r = Invoke-WebRequest -Uri "https://localhost:3000/" -UseBasicParsing -TimeoutSec 5
    Write-Host "Vite OK : https://localhost:3000/ $($r.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Vite ne repond pas" -ForegroundColor Red
    if (Test-Path $logFile) { Get-Content $logFile }
    exit 1
}

# 6. Verifier Outlook
$outlook = Get-Process "OUTLOOK" -ErrorAction SilentlyContinue
if ($outlook) {
    Write-Host "Outlook en cours (PID $($outlook.Id))" -ForegroundColor Green
} else {
    Write-Host "Outlook non demarre. Lance Outlook maintenant." -ForegroundColor Yellow
}

# 7. Instructions
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  TEST LOCAL EN COURS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL : https://localhost:3000/" -ForegroundColor White
Write-Host "  Manifeste : $root\manifest.dev.xml" -ForegroundColor White
Write-Host "  Log Vite : $logFile" -ForegroundColor White
Write-Host ""
Write-Host "  Pour arreter : powershell -ExecutionPolicy Bypass -File scripts\test-local.ps1 -Stop" -ForegroundColor DarkGray
Write-Host ""

# Afficher les logs Vite en continu
Get-Content $logFile -Wait
