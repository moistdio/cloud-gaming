#!/bin/bash

# Cloud Gaming GPU Setup Script
# Konfiguriert NVIDIA Container Runtime für Docker GPU-Support

set -e

echo "🎮 Cloud Gaming GPU Setup"
echo "========================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Prüfe ob NVIDIA GPU vorhanden ist
check_nvidia_gpu() {
    log_info "Checking for NVIDIA GPU..."
    
    if command -v nvidia-smi &> /dev/null; then
        if nvidia-smi &> /dev/null; then
            log_success "NVIDIA GPU detected:"
            nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
            return 0
        else
            log_error "nvidia-smi found but GPU not accessible"
            return 1
        fi
    else
        log_error "nvidia-smi not found - NVIDIA drivers not installed"
        return 1
    fi
}

# Prüfe Docker Installation
check_docker() {
    log_info "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_success "Docker found: $DOCKER_VERSION"
        
        # Prüfe ob Docker läuft
        if docker info &> /dev/null; then
            log_success "Docker daemon is running"
            return 0
        else
            log_error "Docker daemon is not running"
            return 1
        fi
    else
        log_error "Docker not found"
        return 1
    fi
}

# Installiere NVIDIA Container Runtime
install_nvidia_container_runtime() {
    log_info "Installing NVIDIA Container Runtime..."
    
    # Prüfe Betriebssystem
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux Installation
        log_info "Detected Linux system"
        
        # NVIDIA Container Toolkit Repository hinzufügen
        curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
        curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
            sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
            sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
        
        # Pakete aktualisieren und installieren
        sudo apt-get update
        sudo apt-get install -y nvidia-container-toolkit
        
        log_success "NVIDIA Container Toolkit installed"
        
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows mit WSL2
        log_info "Detected Windows system"
        log_warning "For Windows, ensure you have:"
        echo "  1. WSL2 with Ubuntu/Debian"
        echo "  2. NVIDIA drivers for Windows (latest)"
        echo "  3. Docker Desktop with WSL2 backend"
        echo "  4. NVIDIA Container Toolkit in WSL2"
        
        log_info "Run this script inside WSL2 for proper installation"
        return 1
        
    else
        log_error "Unsupported operating system: $OSTYPE"
        return 1
    fi
}

# Konfiguriere Docker für NVIDIA Runtime
configure_docker_nvidia() {
    log_info "Configuring Docker for NVIDIA runtime..."
    
    # NVIDIA Container Runtime konfigurieren
    sudo nvidia-ctk runtime configure --runtime=docker
    
    # Docker daemon neu starten
    log_info "Restarting Docker daemon..."
    sudo systemctl restart docker
    
    # Warten bis Docker wieder verfügbar ist
    sleep 5
    
    # Prüfe ob NVIDIA Runtime verfügbar ist
    if docker info | grep -q nvidia; then
        log_success "NVIDIA runtime configured in Docker"
        return 0
    else
        log_warning "NVIDIA runtime not found in Docker info"
        return 1
    fi
}

# Teste GPU-Zugriff in Container
test_gpu_container() {
    log_info "Testing GPU access in container..."
    
    # Teste mit einfachem NVIDIA Container
    if docker run --rm --gpus all nvidia/cuda:12.2-base-ubuntu22.04 nvidia-smi &> /dev/null; then
        log_success "GPU access in containers working!"
        
        # Zeige GPU-Informationen
        echo "GPU Information from container:"
        docker run --rm --gpus all nvidia/cuda:12.2-base-ubuntu22.04 nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
        
        return 0
    else
        log_error "GPU access in containers not working"
        return 1
    fi
}

# Docker Compose für GPU aktualisieren
update_docker_compose() {
    log_info "Updating docker-compose.yml for GPU support..."
    
    # Backup erstellen
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml docker-compose.yml.backup
        log_info "Backup created: docker-compose.yml.backup"
    fi
    
    # Prüfe ob GPU-Konfiguration bereits vorhanden
    if grep -q "nvidia" docker-compose.yml; then
        log_success "GPU configuration already present in docker-compose.yml"
    else
        log_warning "GPU configuration missing in docker-compose.yml"
        log_info "Please ensure your docker-compose.yml includes GPU runtime configuration"
    fi
}

# Hauptfunktion
main() {
    echo "🎮 Starting GPU setup for Cloud Gaming..."
    echo ""
    
    # Systemprüfungen
    if ! check_nvidia_gpu; then
        log_error "NVIDIA GPU setup failed - no GPU detected"
        exit 1
    fi
    
    if ! check_docker; then
        log_error "Docker setup failed"
        exit 1
    fi
    
    # NVIDIA Container Runtime installieren
    log_info "Setting up NVIDIA Container Runtime..."
    if ! command -v nvidia-ctk &> /dev/null; then
        if ! install_nvidia_container_runtime; then
            log_error "Failed to install NVIDIA Container Runtime"
            exit 1
        fi
    else
        log_success "NVIDIA Container Toolkit already installed"
    fi
    
    # Docker konfigurieren
    if ! configure_docker_nvidia; then
        log_error "Failed to configure Docker for NVIDIA"
        exit 1
    fi
    
    # GPU-Zugriff testen
    if ! test_gpu_container; then
        log_error "GPU container test failed"
        exit 1
    fi
    
    # Docker Compose aktualisieren
    update_docker_compose
    
    echo ""
    log_success "🎉 GPU setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Rebuild your cloud-gaming containers:"
    echo "     docker-compose down"
    echo "     docker-compose up --build -d"
    echo ""
    echo "  2. Create a new desktop container to test GPU access"
    echo ""
    echo "  3. Check GPU status in the container:"
    echo "     docker exec -it <container-name> nvidia-smi"
    echo ""
}

# Script ausführen
main "$@" 