# Cloud Gaming System - Start Script (PowerShell)
# Dieses Script startet das komplette Cloud Gaming System

param(
    [switch]$Force,
    [switch]$Rebuild
)

# Farben für Output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

function Test-Docker {
    Write-Info "Prüfe Docker-Installation..."
    
    try {
        $dockerVersion = docker --version 2>$null
        if (-not $dockerVersion) {
            throw "Docker nicht gefunden"
        }
        
        $dockerInfo = docker info 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker läuft nicht"
        }
        
        Write-Success "Docker ist verfügbar: $($dockerVersion.Split(' ')[2])"
        return $true
    }
    catch {
        Write-Error "Docker ist nicht installiert oder läuft nicht!"
        Write-Info "Bitte installieren Sie Docker Desktop: https://www.docker.com/products/docker-desktop"
        return $false
    }
}

function Test-DockerCompose {
    Write-Info "Prüfe Docker Compose..."
    
    try {
        $composeVersion = docker-compose --version 2>$null
        if (-not $composeVersion) {
            $composeVersion = docker compose version 2>$null
            if (-not $composeVersion) {
                throw "Docker Compose nicht gefunden"
            }
        }
        
        Write-Success "Docker Compose ist verfügbar"
        return $true
    }
    catch {
        Write-Error "Docker Compose ist nicht installiert!"
        return $false
    }
}

function New-Directories {
    Write-Info "Erstelle notwendige Verzeichnisse..."
    
    $directories = @("data", "nginx")
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Verzeichnisse erstellt"
}

function Build-DesktopImage {
    Write-Info "Prüfe Desktop-Container-Image..."
    
    $imageExists = docker images --format "table {{.Repository}}" | Select-String "cloud-gaming-desktop"
    
    if (-not $imageExists -or $Rebuild) {
        Write-Info "Desktop-Image wird erstellt..."
        
        Push-Location "docker/desktop"
        try {
            docker build -t cloud-gaming-desktop .
            if ($LASTEXITCODE -ne 0) {
                throw "Build fehlgeschlagen"
            }
            Write-Success "Desktop-Image erstellt"
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Success "Desktop-Image bereits vorhanden"
    }
}

function Stop-ExistingContainers {
    Write-Info "Stoppe eventuell laufende Container..."
    
    try {
        docker-compose down --remove-orphans 2>$null
        Write-Success "Alte Container gestoppt"
    }
    catch {
        Write-Warning "Keine laufenden Container gefunden"
    }
}

function Start-System {
    Write-Info "Starte Cloud Gaming System..."
    
    try {
        if ($Rebuild) {
            docker-compose up --build -d
        }
        else {
            docker-compose up -d
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Start fehlgeschlagen"
        }
        
        Write-Success "System gestartet!"
    }
    catch {
        Write-Error "Fehler beim Starten des Systems: $_"
        throw
    }
}

function Wait-ForServices {
    Write-Info "Warte auf Services..."
    
    # Warte auf Backend
    Write-Info "Warte auf Backend (Port 3002)..."
    $timeout = 60
    $backendReady = $false
    
    while ($timeout -gt 0 -and -not $backendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                Write-Success "Backend ist bereit"
            }
        }
        catch {
            Start-Sleep -Seconds 2
            $timeout -= 2
        }
    }
    
    if (-not $backendReady) {
        Write-Warning "Backend antwortet nicht nach 60 Sekunden"
    }
    
    # Warte auf Frontend
    Write-Info "Warte auf Frontend (Port 3003)..."
    $timeout = 60
    $frontendReady = $false
    
    while ($timeout -gt 0 -and -not $frontendReady) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3003" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                Write-Success "Frontend ist bereit"
            }
        }
        catch {
            Start-Sleep -Seconds 2
            $timeout -= 2
        }
    }
    
    if (-not $frontendReady) {
        Write-Warning "Frontend antwortet nicht nach 60 Sekunden"
    }
}

function Show-Status {
    Write-Host ""
    Write-Host "🎮 Cloud Gaming System Status" -ForegroundColor $Colors.White
    Write-Host "=============================" -ForegroundColor $Colors.White
    
    # Container Status
    Write-Host ""
    Write-Info "Container Status:"
    docker-compose ps
    
    Write-Host ""
    Write-Info "Verfügbare Services:"
    Write-Host "  🌐 Frontend:  http://localhost:3003" -ForegroundColor $Colors.White
    Write-Host "  🔧 Backend:   http://localhost:3002" -ForegroundColor $Colors.White
    Write-Host "  📊 API Docs:  http://localhost:3002/api/health" -ForegroundColor $Colors.White
    
    Write-Host ""
    Write-Info "Erste Schritte:"
    Write-Host "  1. Öffnen Sie http://localhost:3003 in Ihrem Browser" -ForegroundColor $Colors.White
    Write-Host "  2. Registrieren Sie sich (der erste Benutzer wird Administrator)" -ForegroundColor $Colors.White
    Write-Host "  3. Erstellen Sie Ihren ersten Desktop-Container" -ForegroundColor $Colors.White
    
    Write-Host ""
    Write-Info "Logs anzeigen:"
    Write-Host "  docker-compose logs -f backend" -ForegroundColor $Colors.White
    Write-Host "  docker-compose logs -f frontend" -ForegroundColor $Colors.White
    
    Write-Host ""
    Write-Info "System stoppen:"
    Write-Host "  docker-compose down" -ForegroundColor $Colors.White
}

function Main {
    Write-Host ""
    Write-Host "🚀 Cloud Gaming System wird gestartet..." -ForegroundColor $Colors.White
    Write-Host "==========================================" -ForegroundColor $Colors.White
    Write-Host ""
    
    try {
        Write-Info "Starte Cloud Gaming System Setup..."
        
        if (-not (Test-Docker)) { exit 1 }
        if (-not (Test-DockerCompose)) { exit 1 }
        
        New-Directories
        Build-DesktopImage
        Stop-ExistingContainers
        Start-System
        Wait-ForServices
        Show-Status
        
        Write-Host ""
        Write-Success "🎉 Cloud Gaming System erfolgreich gestartet!"
        Write-Host ""
        
        # Browser öffnen
        $openBrowser = Read-Host "Möchten Sie den Browser öffnen? (y/N)"
        if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
            Start-Process "http://localhost:3003"
        }
    }
    catch {
        Write-Error "Fehler beim Starten des Systems: $_"
        Write-Host ""
        Write-Info "Für Hilfe führen Sie aus: docker-compose logs"
        exit 1
    }
}

# Script ausführen
Main 