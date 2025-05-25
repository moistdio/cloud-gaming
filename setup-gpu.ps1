# Cloud Gaming GPU Setup Script for Windows
# Konfiguriert GPU-Support für Docker Desktop auf Windows

param(
    [switch]$Force,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
🎮 Cloud Gaming GPU Setup for Windows

This script helps configure GPU support for Docker containers on Windows.

Requirements:
- Windows 10/11 with WSL2
- NVIDIA GPU with latest drivers
- Docker Desktop with WSL2 backend
- WSL2 Ubuntu/Debian distribution

Usage:
  .\setup-gpu.ps1          # Check and configure GPU support
  .\setup-gpu.ps1 -Force   # Force reconfiguration
  .\setup-gpu.ps1 -Help    # Show this help

"@
    exit 0
}

# Farben für Output
function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Test-NvidiaGPU {
    Write-Info "Checking for NVIDIA GPU..."
    
    try {
        $gpu = Get-WmiObject -Class Win32_VideoController | Where-Object { $_.Name -like "*NVIDIA*" }
        if ($gpu) {
            Write-Success "NVIDIA GPU detected: $($gpu.Name)"
            return $true
        } else {
            Write-Error "No NVIDIA GPU found"
            return $false
        }
    } catch {
        Write-Error "Failed to check GPU: $($_.Exception.Message)"
        return $false
    }
}

function Test-NvidiaDrivers {
    Write-Info "Checking NVIDIA drivers..."
    
    try {
        $nvidiaPath = "${env:ProgramFiles}\NVIDIA Corporation\NVSMI\nvidia-smi.exe"
        if (Test-Path $nvidiaPath) {
            $output = & $nvidiaPath --query-gpu=name,driver_version --format=csv,noheader 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "NVIDIA drivers working:"
                Write-Host "  $output"
                return $true
            }
        }
        
        Write-Error "NVIDIA drivers not properly installed or accessible"
        Write-Warning "Please install latest NVIDIA drivers from: https://www.nvidia.com/drivers"
        return $false
    } catch {
        Write-Error "Failed to check NVIDIA drivers: $($_.Exception.Message)"
        return $false
    }
}

function Test-WSL2 {
    Write-Info "Checking WSL2..."
    
    try {
        $wslVersion = wsl --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "WSL2 is installed"
            
            # Prüfe verfügbare Distributionen
            $distros = wsl -l -v | Select-String "Ubuntu|Debian"
            if ($distros) {
                Write-Success "Compatible Linux distribution found"
                return $true
            } else {
                Write-Warning "No Ubuntu/Debian distribution found in WSL2"
                Write-Info "Install Ubuntu from Microsoft Store: ms-windows-store://pdp/?ProductId=9PDXGNCFSCZV"
                return $false
            }
        } else {
            Write-Error "WSL2 not installed or not working"
            Write-Info "Install WSL2: https://docs.microsoft.com/en-us/windows/wsl/install"
            return $false
        }
    } catch {
        Write-Error "Failed to check WSL2: $($_.Exception.Message)"
        return $false
    }
}

function Test-DockerDesktop {
    Write-Info "Checking Docker Desktop..."
    
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker Desktop found: $dockerVersion"
            
            # Prüfe ob Docker läuft
            $dockerInfo = docker info 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker Desktop is running"
                
                # Prüfe WSL2 Backend
                if ($dockerInfo -match "WSL") {
                    Write-Success "Docker Desktop using WSL2 backend"
                    return $true
                } else {
                    Write-Warning "Docker Desktop not using WSL2 backend"
                    Write-Info "Enable WSL2 backend in Docker Desktop settings"
                    return $false
                }
            } else {
                Write-Error "Docker Desktop not running"
                return $false
            }
        } else {
            Write-Error "Docker Desktop not found"
            Write-Info "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
            return $false
        }
    } catch {
        Write-Error "Failed to check Docker Desktop: $($_.Exception.Message)"
        return $false
    }
}

function Install-NvidiaContainerToolkit {
    Write-Info "Installing NVIDIA Container Toolkit in WSL2..."
    
    try {
        # Führe Installation in WSL2 aus
        $installScript = @"
#!/bin/bash
set -e

echo "Installing NVIDIA Container Toolkit..."

# Repository hinzufügen
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# Installation
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# Docker konfigurieren
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker || true

echo "NVIDIA Container Toolkit installed successfully"
"@
        
        # Script in WSL2 ausführen
        $installScript | wsl bash
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "NVIDIA Container Toolkit installed in WSL2"
            return $true
        } else {
            Write-Error "Failed to install NVIDIA Container Toolkit"
            return $false
        }
    } catch {
        Write-Error "Failed to install NVIDIA Container Toolkit: $($_.Exception.Message)"
        return $false
    }
}

function Test-GPUContainer {
    Write-Info "Testing GPU access in container..."
    
    try {
        # Teste GPU-Zugriff mit NVIDIA Container
        $testOutput = docker run --rm --gpus all nvidia/cuda:12.2-base-ubuntu22.04 nvidia-smi --query-gpu=name --format=csv,noheader 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $testOutput) {
            Write-Success "GPU access in containers working!"
            Write-Host "  GPU: $testOutput"
            return $true
        } else {
            Write-Error "GPU access in containers not working"
            Write-Warning "Try restarting Docker Desktop and WSL2"
            return $false
        }
    } catch {
        Write-Error "Failed to test GPU container: $($_.Exception.Message)"
        return $false
    }
}

function Update-DockerCompose {
    Write-Info "Checking docker-compose.yml for GPU configuration..."
    
    if (Test-Path "docker-compose.yml") {
        $content = Get-Content "docker-compose.yml" -Raw
        
        if ($content -match "nvidia") {
            Write-Success "GPU configuration found in docker-compose.yml"
        } else {
            Write-Warning "GPU configuration missing in docker-compose.yml"
            Write-Info "The docker-compose.yml should include GPU runtime configuration"
        }
        
        # Backup erstellen
        Copy-Item "docker-compose.yml" "docker-compose.yml.backup" -Force
        Write-Info "Backup created: docker-compose.yml.backup"
    } else {
        Write-Warning "docker-compose.yml not found in current directory"
    }
}

function Main {
    Write-Host "🎮 Cloud Gaming GPU Setup for Windows" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    $allChecksPass = $true
    
    # Systemprüfungen
    if (-not (Test-NvidiaGPU)) { $allChecksPass = $false }
    if (-not (Test-NvidiaDrivers)) { $allChecksPass = $false }
    if (-not (Test-WSL2)) { $allChecksPass = $false }
    if (-not (Test-DockerDesktop)) { $allChecksPass = $false }
    
    if (-not $allChecksPass) {
        Write-Error "System requirements not met. Please fix the issues above."
        exit 1
    }
    
    # NVIDIA Container Toolkit installieren
    Write-Info "Setting up NVIDIA Container Toolkit..."
    if ($Force -or -not (wsl bash -c "command -v nvidia-ctk" 2>$null)) {
        if (-not (Install-NvidiaContainerToolkit)) {
            Write-Error "Failed to install NVIDIA Container Toolkit"
            exit 1
        }
    } else {
        Write-Success "NVIDIA Container Toolkit already installed"
    }
    
    # GPU-Zugriff testen
    if (-not (Test-GPUContainer)) {
        Write-Error "GPU container test failed"
        Write-Info "Try the following troubleshooting steps:"
        Write-Host "  1. Restart Docker Desktop"
        Write-Host "  2. Restart WSL2: wsl --shutdown && wsl"
        Write-Host "  3. Ensure WSL2 integration is enabled in Docker Desktop"
        exit 1
    }
    
    # Docker Compose prüfen
    Update-DockerCompose
    
    Write-Host ""
    Write-Success "🎉 GPU setup completed successfully!"
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Rebuild your cloud-gaming containers:"
    Write-Host "     docker-compose down"
    Write-Host "     docker-compose up --build -d"
    Write-Host ""
    Write-Host "  2. Create a new desktop container to test GPU access"
    Write-Host ""
    Write-Host "  3. Check GPU status in the container:"
    Write-Host "     docker exec -it <container-name> nvidia-smi"
    Write-Host ""
}

# Script ausführen
Main 