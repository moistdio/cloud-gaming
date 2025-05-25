Write-Host "Building Cloud Gaming Desktop Image..." -ForegroundColor Green

# Zum Docker-Verzeichnis wechseln
Set-Location docker/desktop

# Docker Image bauen
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t cloud-gaming-desktop:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Desktop Image erfolgreich erstellt!" -ForegroundColor Green
    Write-Host "Image: cloud-gaming-desktop:latest" -ForegroundColor Cyan
} else {
    Write-Host "❌ Fehler beim Erstellen des Desktop Images" -ForegroundColor Red
    exit 1
}

# Zurück zum Hauptverzeichnis
Set-Location ../..

Write-Host "Fertig!" -ForegroundColor Green 