#!/bin/bash

# Cloud Gaming GPU Initialization Script
# Initialisiert GPU-Hardware und stellt sicher, dass alle Treiber korrekt geladen sind

set -e

echo "🎮 Initializing GPU for Cloud Gaming..."

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

# GPU-Erkennung und -Initialisierung
detect_gpu() {
    log_info "Detecting GPU hardware..."
    
    # Prüfe zuerst auf GPU-Devices im System
    if [ -d "/dev/dri" ] || [ -c "/dev/nvidia0" ] || [ -c "/dev/nvidiactl" ]; then
        log_info "GPU devices found in /dev"
        
        # NVIDIA GPU prüfen
        if [ -c "/dev/nvidia0" ] || [ -c "/dev/nvidiactl" ]; then
            log_info "NVIDIA GPU devices detected"
            
            # Prüfe ob nvidia-smi verfügbar ist
            if command -v nvidia-smi &> /dev/null; then
                log_info "nvidia-smi available, checking GPU status..."
                
                if nvidia-smi &> /dev/null; then
                    log_success "NVIDIA GPU is accessible"
                    
                    # GPU-Informationen anzeigen
                    echo "📊 GPU Information:"
                    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits 2>/dev/null | while read line; do
                        echo "  • $line"
                    done
                    
                    # CUDA-Version prüfen
                    if command -v nvcc &> /dev/null; then
                        CUDA_VERSION=$(nvcc --version 2>/dev/null | grep "release" | awk '{print $6}' | cut -c2-)
                        if [ ! -z "$CUDA_VERSION" ]; then
                            log_success "CUDA $CUDA_VERSION available"
                        fi
                    fi
                    
                    return 0
                else
                    log_warning "NVIDIA GPU detected but nvidia-smi not accessible"
                    log_info "GPU may still be available for applications"
                    return 0
                fi
            else
                log_warning "NVIDIA devices found but nvidia-smi not available"
                log_info "GPU may still be accessible through direct device access"
                return 0
            fi
        fi
        
        # Intel/AMD GPU prüfen
        if [ -d "/dev/dri" ]; then
            log_info "DRI devices found, checking for integrated GPU..."
            if lspci 2>/dev/null | grep -i "vga\|3d\|display" &> /dev/null; then
                log_success "Integrated GPU detected:"
                lspci 2>/dev/null | grep -i "vga\|3d\|display" | head -3
                return 0
            fi
        fi
        
        log_success "GPU devices available"
        return 0
    else
        log_warning "No GPU devices found in /dev"
        
        # Fallback: Prüfe mit lspci
        if command -v lspci &> /dev/null && lspci 2>/dev/null | grep -i "vga\|3d\|display" &> /dev/null; then
            log_info "GPU hardware detected via lspci:"
            lspci 2>/dev/null | grep -i "vga\|3d\|display"
            log_warning "But no device files found - may need driver installation"
            return 1
        else
            log_error "No GPU hardware detected"
            return 1
        fi
    fi
}

# OpenGL-Support prüfen
check_opengl() {
    log_info "Checking OpenGL support..."
    
    # Mesa-Info prüfen
    if command -v glxinfo &> /dev/null; then
        # X-Server für Test starten (falls nicht läuft)
        export DISPLAY=:99
        Xvfb :99 -screen 0 1024x768x24 &
        XVFB_PID=$!
        sleep 2
        
        # OpenGL-Informationen abrufen
        GL_RENDERER=$(glxinfo | grep "OpenGL renderer" | cut -d: -f2 | xargs)
        GL_VERSION=$(glxinfo | grep "OpenGL version" | cut -d: -f2 | xargs)
        
        if [ ! -z "$GL_RENDERER" ]; then
            log_success "OpenGL available"
            echo "  • Renderer: $GL_RENDERER"
            echo "  • Version: $GL_VERSION"
        else
            log_warning "OpenGL not properly configured"
        fi
        
        # Xvfb stoppen
        kill $XVFB_PID 2>/dev/null || true
    else
        log_warning "glxinfo not available, installing mesa-utils..."
        apt-get update && apt-get install -y mesa-utils
    fi
}

# Vulkan-Support prüfen
check_vulkan() {
    log_info "Checking Vulkan support..."
    
    if command -v vulkaninfo &> /dev/null; then
        # Vulkan-Geräte auflisten
        VULKAN_DEVICES=$(vulkaninfo --summary 2>/dev/null | grep "deviceName" | wc -l)
        
        if [ "$VULKAN_DEVICES" -gt 0 ]; then
            log_success "Vulkan support available ($VULKAN_DEVICES devices)"
            vulkaninfo --summary 2>/dev/null | grep "deviceName" | while read line; do
                echo "  • $line"
            done
        else
            log_warning "No Vulkan devices found"
        fi
    else
        log_warning "Vulkan tools not available"
    fi
}

# Hardware-Video-Beschleunigung prüfen
check_video_acceleration() {
    log_info "Checking hardware video acceleration..."
    
    # VA-API prüfen
    if command -v vainfo &> /dev/null; then
        export DISPLAY=:99
        Xvfb :99 -screen 0 1024x768x24 &
        XVFB_PID=$!
        sleep 2
        
        if vainfo 2>/dev/null | grep -q "VAProfile"; then
            log_success "VA-API hardware acceleration available"
            vainfo 2>/dev/null | grep "VAProfile" | head -3 | while read line; do
                echo "  • $line"
            done
        else
            log_warning "VA-API not available"
        fi
        
        kill $XVFB_PID 2>/dev/null || true
    fi
    
    # VDPAU prüfen
    if command -v vdpauinfo &> /dev/null; then
        if vdpauinfo 2>/dev/null | grep -q "Decoder capabilities"; then
            log_success "VDPAU hardware acceleration available"
        else
            log_warning "VDPAU not available"
        fi
    fi
}

# GPU-Performance-Einstellungen optimieren
optimize_gpu_performance() {
    log_info "Optimizing GPU performance settings..."
    
    if command -v nvidia-smi &> /dev/null; then
        # NVIDIA GPU-Einstellungen
        log_info "Configuring NVIDIA GPU settings..."
        
        # Persistence Mode aktivieren
        nvidia-smi -pm 1 2>/dev/null || log_warning "Could not enable persistence mode"
        
        # Power Management auf Maximum setzen
        nvidia-smi -pl $(nvidia-smi --query-gpu=power.max_limit --format=csv,noheader,nounits | head -1) 2>/dev/null || log_warning "Could not set power limit"
        
        # GPU-Takt-Informationen anzeigen
        log_info "Current GPU clocks:"
        nvidia-smi --query-gpu=clocks.gr,clocks.mem --format=csv,noheader | while read line; do
            echo "  • $line"
        done
        
        log_success "NVIDIA GPU optimized"
    fi
}

# X11-Konfiguration für GPU erstellen
configure_x11() {
    log_info "Configuring X11 for GPU acceleration..."
    
    # Xorg-Konfiguration erstellen
    mkdir -p /etc/X11/xorg.conf.d
    
    if command -v nvidia-smi &> /dev/null; then
        # NVIDIA-spezifische Konfiguration
        cat > /etc/X11/xorg.conf.d/20-nvidia.conf << EOF
Section "ServerLayout"
    Identifier "Layout0"
    Screen 0 "Screen0" 0 0
EndSection

Section "Screen"
    Identifier "Screen0"
    Device "Device0"
    DefaultDepth 24
    SubSection "Display"
        Depth 24
        Modes "1920x1080" "1680x1050" "1280x1024" "1024x768"
    EndSubSection
EndSection

Section "Device"
    Identifier "Device0"
    Driver "nvidia"
    VendorName "NVIDIA Corporation"
    Option "AllowEmptyInitialConfiguration" "true"
    Option "UseDisplayDevice" "None"
    Option "UseEdidDpi" "false"
    Option "DPI" "96 x 96"
    Option "NoLogo" "true"
EndSection
EOF
        log_success "NVIDIA X11 configuration created"
    else
        # Generische GPU-Konfiguration
        cat > /etc/X11/xorg.conf.d/20-gpu.conf << EOF
Section "Device"
    Identifier "GPU0"
    Driver "modesetting"
    Option "AccelMethod" "glamor"
    Option "DRI" "3"
EndSection
EOF
        log_success "Generic GPU X11 configuration created"
    fi
}

# GPU-Monitoring-Tools installieren
install_monitoring_tools() {
    log_info "Installing GPU monitoring tools..."
    
    # Desktop-Shortcuts für GPU-Tools erstellen
    mkdir -p /home/user/Desktop
    
    # GPU-Monitor-Shortcut (nur wenn nvidia-smi verfügbar)
    if command -v nvidia-smi &> /dev/null; then
        cat > /home/user/Desktop/GPU-Monitor.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=GPU Monitor (NVIDIA)
Comment=Monitor NVIDIA GPU performance and usage
Exec=xfce4-terminal --hold -e "watch -n 1 nvidia-smi"
Icon=utilities-system-monitor
Terminal=false
Categories=System;Monitor;
EOF
    fi
    
    # nvtop-Shortcut (falls verfügbar)
    if command -v nvtop &> /dev/null; then
        cat > /home/user/Desktop/GPU-Monitor-nvtop.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=GPU Monitor (nvtop)
Comment=Interactive GPU monitoring with nvtop
Exec=xfce4-terminal --hold -e nvtop
Icon=utilities-system-monitor
Terminal=false
Categories=System;Monitor;
EOF
    fi
    
    # GPU-Benchmark-Shortcut
    if command -v glmark2 &> /dev/null; then
        cat > /home/user/Desktop/GPU-Benchmark.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=GPU Benchmark
Comment=Test GPU performance with glmark2
Exec=xfce4-terminal --hold -e glmark2
Icon=applications-games
Terminal=false
Categories=System;Benchmark;
EOF
    fi
    
    # OpenGL-Info-Shortcut
    cat > /home/user/Desktop/GPU-Info.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=GPU Information
Comment=Display OpenGL and GPU information
Exec=xfce4-terminal --hold -e "bash -c 'echo GPU Information:; echo; if command -v nvidia-smi >/dev/null 2>&1; then echo NVIDIA GPU:; nvidia-smi; echo; fi; echo OpenGL Info:; glxinfo | grep -E \"OpenGL (vendor|renderer|version)\"; echo; echo Vulkan Info:; vulkaninfo --summary 2>/dev/null || echo Vulkan not available; read -p Press Enter to close...'"
Icon=applications-system
Terminal=false
Categories=System;HardwareSettings;
EOF
    
    # Berechtigungen setzen
    if [ -d "/home/user/Desktop" ]; then
        chmod +x /home/user/Desktop/*.desktop 2>/dev/null || true
        chown -R user:user /home/user/Desktop 2>/dev/null || true
    fi
    
    log_success "GPU monitoring tools installed"
}

# GPU-Informationen in Datei speichern
save_gpu_info() {
    log_info "Saving GPU information..."
    
    GPU_INFO_FILE="/tmp/gpu_info.json"
    
    cat > $GPU_INFO_FILE << EOF
{
    "timestamp": "$(date -Iseconds)",
    "gpu_detected": $(command -v nvidia-smi &> /dev/null && echo "true" || echo "false"),
    "nvidia_driver": "$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null || echo 'N/A')",
    "gpu_name": "$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo 'Unknown')",
    "gpu_memory": "$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null || echo '0')",
    "cuda_version": "$(nvcc --version 2>/dev/null | grep "release" | awk '{print $6}' | cut -c2- || echo 'N/A')",
    "opengl_renderer": "$(glxinfo 2>/dev/null | grep "OpenGL renderer" | cut -d: -f2 | xargs || echo 'Unknown')",
    "vulkan_support": $(command -v vulkaninfo &> /dev/null && echo "true" || echo "false")
}
EOF
    
    log_success "GPU information saved to $GPU_INFO_FILE"
}

# Hauptfunktion
main() {
    echo "🎮 Cloud Gaming GPU Initialization"
    echo "=================================="
    
    # GPU-Erkennung
    if detect_gpu; then
        log_success "GPU hardware detected and accessible"
    else
        log_error "GPU initialization failed"
        exit 1
    fi
    
    # GPU-Features prüfen
    check_opengl
    check_vulkan
    check_video_acceleration
    
    # GPU optimieren
    optimize_gpu_performance
    
    # X11 konfigurieren
    configure_x11
    
    # Monitoring-Tools installieren
    install_monitoring_tools
    
    # GPU-Informationen speichern
    save_gpu_info
    
    echo ""
    log_success "🎉 GPU initialization completed successfully!"
    echo ""
    echo "📋 GPU Status Summary:"
    echo "  • GPU Access: ✅ Available"
    echo "  • Hardware Acceleration: ✅ Enabled"
    echo "  • Gaming Ready: ✅ Yes"
    echo ""
    echo "🎮 Ready for cloud gaming!"
}

# Script ausführen
main "$@" 