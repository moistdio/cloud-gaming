Write-Host "🚀 Cloud Gaming System Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Prüfen ob Docker läuft
Write-Host "Prüfe Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker gefunden" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker nicht gefunden oder läuft nicht" -ForegroundColor Red
    Write-Host "Bitte installiere Docker Desktop und starte es" -ForegroundColor Yellow
    exit 1
}

# Prüfen ob Docker Compose verfügbar ist
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose gefunden" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose nicht gefunden" -ForegroundColor Red
    exit 1
}

# Backend package-lock.json erstellen falls nicht vorhanden
if (-not (Test-Path "backend/package-lock.json")) {
    Write-Host "Erstelle Backend package-lock.json..." -ForegroundColor Yellow
    Set-Location backend
    npm install --package-lock-only
    Set-Location ..
    Write-Host "✅ Backend package-lock.json erstellt" -ForegroundColor Green
}

# Frontend package-lock.json erstellen falls nicht vorhanden
if (-not (Test-Path "frontend/package-lock.json")) {
    Write-Host "Erstelle Frontend package-lock.json..." -ForegroundColor Yellow
    Set-Location frontend
    npm install --package-lock-only
    Set-Location ..
    Write-Host "✅ Frontend package-lock.json erstellt" -ForegroundColor Green
}

# Desktop Image bauen
Write-Host "Baue Desktop Image..." -ForegroundColor Yellow
Set-Location docker/desktop
docker build -t cloud-gaming-desktop:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Desktop Image Build fehlgeschlagen" -ForegroundColor Red
    exit 1
}
Set-Location ../..
Write-Host "✅ Desktop Image erstellt" -ForegroundColor Green

# System starten
Write-Host "Starte Cloud Gaming System..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "" -ForegroundColor Green
    Write-Host "🎉 Cloud Gaming System erfolgreich gestartet!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "Zugriff:" -ForegroundColor Cyan
    Write-Host "  Web-Interface: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend-API:   http://localhost:3001" -ForegroundColor White
    Write-Host "" -ForegroundColor Green
    Write-Host "Erste Schritte:" -ForegroundColor Cyan
    Write-Host "  1. Öffne http://localhost:3000" -ForegroundColor White
    Write-Host "  2. Registriere einen Account" -ForegroundColor White
    Write-Host "  3. Erstelle einen Container" -ForegroundColor White
    Write-Host "  4. Verbinde dich via VNC" -ForegroundColor White
    Write-Host "" -ForegroundColor Green
    Write-Host "Logs anzeigen: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "System stoppen: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "❌ Fehler beim Starten des Systems" -ForegroundColor Red
    Write-Host "Logs prüfen: docker-compose logs" -ForegroundColor Yellow
} 