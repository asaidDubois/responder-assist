# Active Cloudflare Quick Tunnel sur le port 3000 et met à jour manifest.dev.xml
# Usage: .\start-tunnel.ps1 [-Port 3000] [-NoWait]
#
# Pré-requis : Vite doit tourner sur le port spécifié (npm run dev)

param(
    [int]$Port = 3000,
    [switch]$NoWait
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$parent = Split-Path -Parent $root
if (-not (Test-Path (Join-Path $root "manifest.dev.xml"))) {
    $root = $parent
}
$tunnelDir = $PSScriptRoot
$bin = Join-Path $tunnelDir "cloudflared.exe"
$logFile = Join-Path $tunnelDir "tunnel.log"
$urlFile = Join-Path $tunnelDir "public-url.txt"
$manifest = Join-Path $root "manifest.dev.xml"
$manifestBak = Join-Path $tunnelDir "manifest.dev.xml.bak"

if (-not (Test-Path $manifest)) {
    Write-Host "[ERREUR] manifest.dev.xml introuvable : $manifest" -ForegroundColor Red
    exit 1
}

function Write-Step($n, $total, $msg) {
    Write-Host "[$n/$total] $msg" -ForegroundColor Cyan
}

# 1. Télécharger cloudflared si absent
if (-not (Test-Path $bin)) {
    Write-Step 1 5 "Téléchargement de cloudflared (1ère fois)..."
    $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    try {
        Invoke-WebRequest -Uri $url -OutFile $bin -UseBasicParsing -TimeoutSec 90
    } catch {
        Write-Host "[ERREUR] Téléchargement échoué : $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    Write-Host "    OK ($([math]::Round((Get-Item $bin).Length / 1MB, 1)) Mo)" -ForegroundColor Green
} else {
    Write-Step 1 5 "cloudflared déjà présent"
}

# 2. Vérifier que Vite tourne
Write-Step 2 5 "Vérification de Vite sur le port $Port..."
$portInUse = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $portInUse) {
    Write-Host "[ERREUR] Vite ne tourne pas sur le port $Port" -ForegroundColor Red
    Write-Host "Lance dans un autre terminal : npm run dev" -ForegroundColor Yellow
    exit 1
}
Write-Host "    OK" -ForegroundColor Green

# 3. Sauvegarder le manifeste original
Write-Step 3 5 "Sauvegarde du manifeste original..."
Copy-Item -Path $manifest -Destination $manifestBak -Force
Write-Host "    OK -> $manifestBak" -ForegroundColor DarkGray

# 4. Démarrer le tunnel
Write-Step 4 5 "Démarrage du tunnel Cloudflare (Quick Tunnel)..."
if (Test-Path $logFile) { Remove-Item $logFile }
if (Test-Path $urlFile) { Remove-Item $urlFile }

$tunnelArgs = @(
    "tunnel","--url","http://localhost:$Port",
    "--no-autoupdate",
    "--logfile",$logFile,
    "--metrics","127.0.0.1:0"
)
$proc = Start-Process -FilePath $bin -ArgumentList $tunnelArgs -PassThru -WindowStyle Hidden
Write-Host "    PID: $($proc.Id)"

# 5. Attendre l'URL publique ET sa joignabilité
Write-Step 5 5 "Attente de l'URL publique..."
$publicUrl = $null
for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw
        $match = [regex]::Match($content, 'https://[a-z0-9-]+\.trycloudflare\.com')
        if ($match.Success) {
            $publicUrl = $match.Value
            break
        }
    }
    if ($i % 5 -eq 4) { Write-Host "    attente... ($($i+1)s)" }
}

if (-not $publicUrl) {
    Write-Host "[ERREUR] URL publique introuvable. Voir : $logFile" -ForegroundColor Red
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
Set-Content -Path $urlFile -Value $publicUrl -Encoding UTF8

# Tester la joignabilité
Write-Host "    Test de joignabilité de $publicUrl ..." -NoNewline
$reachable = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "$publicUrl/" -UseBasicParsing -TimeoutSec 5 -Headers @{"User-Agent"="OutlookAddinValidation/1.0"}
        if ($r.StatusCode -eq 200) {
            $reachable = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}
if ($reachable) {
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " TIMEOUT (peut quand même fonctionner)" -ForegroundColor Yellow
}

# 6. Mettre à jour le manifeste
Write-Host ""
Write-Host "Mise à jour du manifeste..." -ForegroundColor Cyan
$content = Get-Content $manifest -Raw -Encoding UTF8
$content = $content -replace 'https://localhost:3000', $publicUrl
$content = $content -replace 'http://localhost:3000', $publicUrl
# Restaurer l'encodage UTF-8 BOM
$utf8Bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($manifest, $content, $utf8Bom)
Write-Host "    OK" -ForegroundColor Green

# 7. Validation XML
Write-Host ""
Write-Host "Validation du manifeste..." -ForegroundColor Cyan
try {
    [xml]$x = Get-Content $manifest -Raw
    Write-Host "    XML valide" -ForegroundColor Green
    # Vérifier que toutes les URLs sont remplacées
    $remaining = $x | Select-String -Pattern "localhost" -AllMatches
    if ($remaining) {
        Write-Host "    [ATTENTION] Reste des références à localhost :" -ForegroundColor Yellow
        $remaining | ForEach-Object { Write-Host "      $($_.Line)" -ForegroundColor Yellow }
    }
} catch {
    Write-Host "    [ERREUR] XML invalide : $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Rapport final
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  TUNNEL ACTIF" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "  URL publique : $publicUrl" -ForegroundColor White
Write-Host "  Manifeste    : $manifest" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dans Outlook Web :" -ForegroundColor Yellow
Write-Host "  1. Va sur https://outlook.office.com et ouvre un courriel"
Write-Host "  2. ... > Obtenir des compléments > Mes compléments"
Write-Host "  3. + > Ajouter un complément personnalisé > À partir d'un fichier"
Write-Host "  4. Sélectionne : $manifest"
Write-Host ""
Write-Host "Garde Vite ET ce terminal ouverts pendant l'utilisation." -ForegroundColor DarkGray
Write-Host "Pour arrêter le tunnel : Ctrl+C ou 'npm run tunnel:stop'" -ForegroundColor DarkGray
Write-Host ""

# Sauvegarder l'URL pour le script d'arrêt
$env:RESPONDER_TUNNEL_PID = $proc.Id
$env:RESPONDER_PUBLIC_URL = $publicUrl

# Garder le tunnel actif
if ($NoWait) {
    Write-Host "Mode NoWait : le script rend la main, le tunnel continue en arrière-plan." -ForegroundColor Yellow
    Write-Host "PID du tunnel : $($proc.Id)" -ForegroundColor Yellow
    return
}

try {
    while ($true) {
        Start-Sleep -Seconds 5
        if ($proc.HasExited) {
            Write-Host ""
            Write-Host "[ALERTE] Le tunnel s'est arrêté (exit code $($proc.ExitCode))" -ForegroundColor Red
            break
        }
    }
} finally {
    Cleanup-Tunnel -Proc $proc -Manifest $manifest -ManifestBak $manifestBak
}

function Cleanup-Tunnel($Proc, $Manifest, $ManifestBak) {
    Write-Host ""
    Write-Host "Restauration du manifeste..." -ForegroundColor Cyan
    if (Test-Path $ManifestBak) {
        Copy-Item -Path $ManifestBak -Destination $Manifest -Force
        Remove-Item $ManifestBak -Force
        Write-Host "    OK" -ForegroundColor Green
    }
    if ($Proc -and -not $Proc.HasExited) {
        Stop-Process -Id $Proc.Id -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $urlFile -ErrorAction SilentlyContinue
}
