# Stoppe le tunnel Cloudflare actif et restaure le manifeste
$root = Split-Path -Parent $PSScriptRoot
$manifestBak = Join-Path $root "tunnel\manifest.dev.xml.bak"
$manifest = Join-Path $root "manifest.dev.xml"
$urlFile = Join-Path $root "tunnel\public-url.txt"

Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Arrêt de cloudflared (PID $($_.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force
}

if (Test-Path $manifestBak) {
    Write-Host "Restauration du manifeste..." -ForegroundColor Cyan
    Copy-Item -Path $manifestBak -Destination $manifest -Force
    Remove-Item $manifestBak -Force
    Write-Host "    OK" -ForegroundColor Green
}

Remove-Item $urlFile -ErrorAction SilentlyContinue
Write-Host "Tunnel arrêté" -ForegroundColor Green
