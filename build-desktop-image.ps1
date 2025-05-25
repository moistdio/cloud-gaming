# Cloud Gaming Desktop Image Build Script (PowerShell)
# Baut das Docker-Image für die virtuellen Desktop-Container

Write-Host "🏗️ Building Cloud Gaming Desktop Image..." -ForegroundColor Cyan

# Zum Docker-Verzeichnis wechseln
Set-Location "docker/desktop"

try {
    # Docker-Image bauen
    Write-Host "📦 Building Docker image..." -ForegroundColor Yellow
    docker build -t cloud-gaming-desktop:latest .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Desktop image successfully built!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Image Information:" -ForegroundColor Cyan
        docker images cloud-gaming-desktop:latest
        Write-Host ""
        Write-Host "🚀 You can now start the system with:" -ForegroundColor Green
        Write-Host "   docker-compose up -d" -ForegroundColor White
    } else {
        Write-Host "❌ Failed to build desktop image" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Zurück zum Hauptverzeichnis
    Set-Location "../.."
}

Write-Host "✨ Build process completed!" -ForegroundColor Green 