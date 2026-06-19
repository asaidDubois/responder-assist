# Active GitHub Pages sur la branche gh-pages via l'API
# Necessite un token GitHub avec permissions repo + pages
# Genere un token sur https://github.com/settings/tokens (scope: repo, pages)
# Ou utilise gh CLI: gh auth login

param(
    [string]$Token = $env:GITHUB_TOKEN
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if (-not $Token) {
    Write-Host "Token manquant. Definir GITHUB_TOKEN ou utiliser -Token" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Creer un token: https://github.com/settings/tokens"
    Write-Host "     - Cocher 'repo' et 'pages'" -ForegroundColor Yellow
    Write-Host "  2. Ou installer gh CLI: winget install GitHub.CLI"
    Write-Host "     Puis: gh auth login" -ForegroundColor Yellow
    exit 1
}

$repo = "asaidDubois/responder-assist"
$headers = @{
    Authorization = "token $Token"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

# 1. Verifier que la branche gh-pages existe
Write-Host "Verification de la branche gh-pages..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/branches/gh-pages" -Headers $headers -Method Get | Out-Null
    Write-Host "  OK" -ForegroundColor Green
} catch {
    Write-Host "  Branche gh-pages absente. Push d'abord le code." -ForegroundColor Red
    exit 1
}

# 2. Activer Pages
Write-Host "Activation de GitHub Pages..." -ForegroundColor Cyan
$body = @{
    source = @{
        branch = "gh-pages"
        path = "/"
    }
} | ConvertTo-Json

try {
    $r = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/pages" -Headers $headers -Method Post -Body $body -ContentType "application/json"
    Write-Host "  OK !" -ForegroundColor Green
    Write-Host "  URL: $($r.html_url)" -ForegroundColor Green
    Write-Host "  Status: $($r.status)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Le site sera disponible dans 1-2 minutes a :" -ForegroundColor Yellow
    Write-Host "  https://asaiddubois.github.io/responder-assist/" -ForegroundColor Green
} catch {
    $errBody = $_.Exception.Response
    if ($errBody) {
        $stream = $errBody.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "  Erreur: $($reader.ReadToEnd())" -ForegroundColor Red
    } else {
        Write-Host "  Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Si le token n'a pas les permissions, active Pages manuellement :" -ForegroundColor Yellow
    Write-Host "  https://github.com/asaidDubois/responder-assist/settings/pages" -ForegroundColor Cyan
}
