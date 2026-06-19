# Build + prépare le dossier dist/ pour GitHub Pages
# Usage: .\scripts\build-github.ps1 [-GitHubUser "user"] [-RepoName "repo"]

param(
    [string]$GitHubUser = "",
    [string]$RepoName = "responder-assist"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Build pour GitHub Pages ===" -ForegroundColor Cyan

# 1. Générer les icônes
if (-not (Test-Path "public\assets\icon-64.png")) {
    Write-Host "Génération des icônes..." -ForegroundColor Yellow
    node generate-icons.cjs
} else {
    Write-Host "Icônes déjà présentes" -ForegroundColor DarkGray
}

# 2. Build
Write-Host "Build Vite..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:DEPLOY = "github"
$env:GITHUB_REPOSITORY = "user/$RepoName"
npx vite build

# 3. Aplatir commands.html
if (Test-Path "dist\src\commands\commands.html") {
    Write-Host "Aplatissement de commands.html..." -ForegroundColor Yellow
    Copy-Item "dist\src\commands\commands.html" "dist\commands.html" -Force
    Remove-Item "dist\src" -Recurse -Force
}

# 4. Créer 404.html
Copy-Item "dist\index.html" "dist\404.html" -Force

# 5. Générer le manifeste si GitHubUser fourni
if ($GitHubUser) {
    Write-Host "Génération du manifeste pour $GitHubUser/$RepoName..." -ForegroundColor Yellow
    & "$PSScriptRoot\build-manifest.ps1" -GitHubUser $GitHubUser -RepoName $RepoName
}

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Green
Write-Host "Dossier prêt pour GitHub Pages : $root\dist"
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Commit et push sur GitHub"
Write-Host "  2. Active Pages sur la branche 'gh-pages' ou via GitHub Actions"
