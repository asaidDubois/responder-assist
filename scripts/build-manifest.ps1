# Génère manifest.github.xml à partir de manifest.github.xml.template en remplaçant GITHUB_USER et REPO_NAME
# Usage: .\scripts\build-manifest.ps1 -GitHubUser "mon-user" -RepoName "responder-assist"

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUser,

    [Parameter(Mandatory=$true)]
    [string]$RepoName
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$template = Join-Path $root "manifest.github.xml"
$output = Join-Path $root "manifest.xml"

if (-not (Test-Path $template)) {
    Write-Host "[ERREUR] Template introuvable : $template" -ForegroundColor Red
    exit 1
}

$content = Get-Content $template -Raw -Encoding UTF8
$content = $content -replace 'GITHUB_USER', $GitHubUser
$content = $content -replace 'REPO_NAME', $RepoName

# Encoder en UTF-8 BOM (Outlook exige)
$utf8Bom = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($output, $content, $utf8Bom)

$url = "https://$GitHubUser.github.io/$RepoName/"
Write-Host ""
Write-Host "Manifeste généré : $output" -ForegroundColor Green
Write-Host "URL de l'add-in  : $url" -ForegroundColor Green
Write-Host ""
Write-Host "Dans Outlook Web :" -ForegroundColor Yellow
Write-Host "  1. Ouvre un courriel sur https://outlook.office.com"
Write-Host "  2. ... > Obtenir des compléments > Mes compléments"
Write-Host "  3. + > Ajouter un complément personnalisé > À partir d'un fichier"
Write-Host "  4. Sélectionne : $output"
