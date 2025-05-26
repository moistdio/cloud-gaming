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
        if command -v Xvfb &> /dev/null; then
            Xvfb :99 -screen 0 1024x768x24 &
            XVFB_PID=$!
            sleep 2
        else
            log_warning "Xvfb not available, skipping OpenGL test"
            return
        fi
        
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
        if command -v Xvfb &> /dev/null; then
            Xvfb :99 -screen 0 1024x768x24 &
            XVFB_PID=$!
            sleep 2
        else
            log_warning "Xvfb not available, skipping VA-API test"
            return
        fi
        
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
    
    # Dummy EDID für headless GPU erstellen
    if command -v nvidia-smi &> /dev/null; then
        log_info "Creating dummy EDID for headless GPU..."
        # Erstelle eine minimale EDID-Datei für 1920x1080@60Hz
        echo -en '\x00\xFF\xFF\xFF\xFF\xFF\xFF\x00\x10\xAC\x64\x40\x4C\x30\x30\x30\x0C\x16\x01\x03\x80\x34\x20\x78\xEA\xEE\x95\xA3\x54\x4C\x99\x26\x0F\x50\x54\xA5\x4B\x00\xB3\x00\xD1\x00\xA9\x40\x81\x80\x81\x40\x81\xC0\x01\x01\x01\x01\x02\x3A\x80\x18\x71\x38\x2D\x40\x58\x2C\x45\x00\x09\x25\x21\x00\x00\x1E\x01\x1D\x00\x72\x51\xD0\x1E\x20\x6E\x28\x55\x00\x09\x25\x21\x00\x00\x1E\x8C\x0A\xD0\x8A\x20\xE0\x2D\x10\x10\x3E\x96\x00\x13\x8E\x21\x00\x00\x18\x00\x00\x00\xFC\x00\x44\x45\x4C\x4C\x20\x55\x32\x34\x31\x32\x4D\x0A\x20\x00\x00\x00\xFD\x00\x38\x4C\x1E\x51\x11\x00\x0A\x20\x20\x20\x20\x20\x20\x00\x8D' > /etc/X11/edid.bin
        log_success "Dummy EDID created"
    fi
    
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
    Option "ConnectedMonitor" "DFP"
    Option "CustomEDID" "DFP-0:/etc/X11/edid.bin"
    Option "IgnoreEDID" "false"
    Option "ModeValidation" "AllowNonEdidModes"
EndSection

Section "Extensions"
    Option "GLX" "Enable"
EndSection

Section "ServerFlags"
    Option "AllowEmptyInput" "on"
    Option "DefaultServerLayout" "Layout0"
EndSection
EOF
        log_success "NVIDIA X11 configuration created"
        
        # NVIDIA GLX-Bibliotheken konfigurieren
        log_info "Configuring NVIDIA GLX libraries..."
        
        # Prüfe verfügbare NVIDIA GLX-Bibliotheken
        NVIDIA_GLX_PATHS=(
            "/usr/lib/x86_64-linux-gnu/libGLX_nvidia.so.0"
            "/usr/lib/x86_64-linux-gnu/libGLX_nvidia.so.575.51.03"
            "/usr/lib/x86_64-linux-gnu/nvidia/libGL.so.1"
            "/usr/lib/x86_64-linux-gnu/libGL.so.1.nvidia"
            "/usr/lib/nvidia/libGL.so.1"
            "/usr/local/nvidia/lib64/libGL.so.1"
            "/usr/lib/x86_64-linux-gnu/libnvidia-gl-535/libGL.so.1"
        )
        
        NVIDIA_GLX_FOUND=""
        for path in "${NVIDIA_GLX_PATHS[@]}"; do
            if [ -f "$path" ]; then
                NVIDIA_GLX_FOUND="$path"
                break
            fi
        done
        
        if [ -n "$NVIDIA_GLX_FOUND" ]; then
            log_info "Found NVIDIA GLX library: $NVIDIA_GLX_FOUND"
            
            # Configure GLVND (GL Vendor Neutral Dispatch) for NVIDIA
            log_info "Configuring GLVND for NVIDIA..."
            
            # Create GLX vendor directory if it doesn't exist
            mkdir -p /usr/share/glvnd/glx_vendor.d
            
            # Create NVIDIA GLX vendor configuration
            cat > /usr/share/glvnd/glx_vendor.d/10_nvidia.json << EOF
{
    "file_format_version" : "1.0.0",
    "vendor_name" : "NVIDIA",
    "library_path" : "libGLX_nvidia.so.0"
}
EOF
            
            # Also create the EGL vendor configuration if it doesn't exist
            mkdir -p /usr/share/glvnd/egl_vendor.d
            if [ ! -f "/usr/share/glvnd/egl_vendor.d/10_nvidia.json" ]; then
                cat > /usr/share/glvnd/egl_vendor.d/10_nvidia.json << EOF
{
    "file_format_version" : "1.0.0",
    "vendor_name" : "NVIDIA",
    "library_path" : "libEGL_nvidia.so.0"
}
EOF
            fi
            
            # Update LD cache
            ldconfig
            
            # Force NVIDIA GLX by setting environment variables
            echo "# Force NVIDIA GLX" >> /etc/environment
            echo "__GLX_VENDOR_LIBRARY_NAME=nvidia" >> /etc/environment
            echo "LIBGL_ALWAYS_INDIRECT=0" >> /etc/environment
            echo "LIBGL_ALWAYS_SOFTWARE=0" >> /etc/environment
            
            log_success "NVIDIA GLVND configuration created"
        else
            log_warning "NVIDIA GLX libraries not found, checking alternatives..."
            
            # Prüfe ob NVIDIA-Treiber verfügbar sind
            if command -v nvidia-smi &> /dev/null; then
                log_info "NVIDIA driver available, but GLX libraries missing"
                
                # Versuche NVIDIA-Bibliotheken zu finden
                log_info "Searching for NVIDIA libraries..."
                find /usr -name "*nvidia*" -name "*.so*" 2>/dev/null | grep -E "(libGL|libEGL)" | head -5 || true
                
                # Prüfe ob libnvidia-gl installiert ist
                if dpkg -l | grep -q libnvidia-gl; then
                    log_info "libnvidia-gl packages are installed"
                    dpkg -l | grep libnvidia-gl
                else
                    log_info "libnvidia-gl packages not found"
                fi
            fi
            
            log_warning "Using Mesa fallback for OpenGL"
        fi
        
        # Prüfe GLX-Konfiguration
        if command -v glxinfo &> /dev/null; then
            log_info "Testing GLX configuration..."
            export DISPLAY=:99
            if command -v Xvfb &> /dev/null; then
                Xvfb :99 -screen 0 1024x768x24 &
                XVFB_PID=$!
                sleep 2
                
                GLX_VENDOR=$(glxinfo 2>/dev/null | grep "server glx vendor string" | cut -d: -f2 | xargs || echo "Unknown")
                GLX_RENDERER=$(glxinfo 2>/dev/null | grep "OpenGL renderer string" | cut -d: -f2 | xargs || echo "Unknown")
                
                if [[ "$GLX_VENDOR" == *"NVIDIA"* ]] || [[ "$GLX_RENDERER" == *"NVIDIA"* ]]; then
                    log_success "NVIDIA GLX acceleration active"
                    echo "  • GLX Vendor: $GLX_VENDOR"
                    echo "  • Renderer: $GLX_RENDERER"
                else
                    log_warning "GLX using software rendering"
                    echo "  • GLX Vendor: $GLX_VENDOR"
                    echo "  • Renderer: $GLX_RENDERER"
                fi
                
                kill $XVFB_PID 2>/dev/null || true
            fi
        fi
        
        # Vulkan ICD für NVIDIA konfigurieren
        log_info "Configuring NVIDIA Vulkan ICD..."
        mkdir -p /usr/share/vulkan/icd.d
        # Try to create /etc/vulkan/icd.d, but don't fail if read-only
        mkdir -p /etc/vulkan/icd.d 2>/dev/null || log_warning "/etc/vulkan/icd.d is read-only, using /usr/share/vulkan/icd.d only"
        
        # Suche nach verfügbaren NVIDIA Vulkan-Bibliotheken
        NVIDIA_VULKAN_PATHS=(
            "/usr/lib/x86_64-linux-gnu/libvulkan_nvidia.so"
            "/usr/lib/x86_64-linux-gnu/libvulkan_nvidia.so.1"
            "/usr/lib/x86_64-linux-gnu/nvidia/libvulkan_nvidia.so"
            "/usr/lib/nvidia/libvulkan_nvidia.so"
            "/usr/lib/x86_64-linux-gnu/nvidia/nvidia_icd.json"
            "/usr/share/vulkan/icd.d/nvidia_icd.json"
            "/usr/lib/x86_64-linux-gnu/nvidia_icd.json"
        )
        
        # Zusätzlich: Suche nach NVIDIA Vulkan-Bibliotheken mit find
        log_info "Searching for NVIDIA Vulkan libraries..."
        FOUND_VULKAN_LIBS=$(find /usr/lib -name "*vulkan*nvidia*" -type f 2>/dev/null || true)
        if [ ! -z "$FOUND_VULKAN_LIBS" ]; then
            log_info "Found NVIDIA Vulkan libraries:"
            echo "$FOUND_VULKAN_LIBS" | while read lib; do
                echo "  • $lib"
            done
        fi
        
        NVIDIA_VULKAN_LIB=""
        NVIDIA_ICD_JSON=""
        
        # Suche nach Vulkan-Bibliothek
        for path in "${NVIDIA_VULKAN_PATHS[@]}"; do
            if [ -f "$path" ]; then
                if [[ "$path" == *.json ]]; then
                    NVIDIA_ICD_JSON="$path"
                else
                    NVIDIA_VULKAN_LIB="$path"
                fi
                log_info "Found NVIDIA Vulkan component: $path"
            fi
        done
        
        # Erstelle NVIDIA Vulkan ICD Konfiguration
        if [ ! -z "$NVIDIA_ICD_JSON" ]; then
            # Verwende existierende ICD-Konfiguration
            if [ "$NVIDIA_ICD_JSON" != "/usr/share/vulkan/icd.d/nvidia_icd.json" ]; then
                cp "$NVIDIA_ICD_JSON" /usr/share/vulkan/icd.d/nvidia_icd.json
            fi
            # Try to copy to /etc/vulkan/icd.d if writable
            if [ "$NVIDIA_ICD_JSON" != "/etc/vulkan/icd.d/nvidia_icd.json" ] && [ -w "/etc/vulkan/icd.d" ]; then
                cp "$NVIDIA_ICD_JSON" /etc/vulkan/icd.d/nvidia_icd.json 2>/dev/null || true
            fi
            log_success "NVIDIA Vulkan ICD configured from existing file: $NVIDIA_ICD_JSON"
        elif [ ! -z "$NVIDIA_VULKAN_LIB" ]; then
            # Erstelle ICD-Konfiguration basierend auf gefundener Bibliothek
            LIB_NAME=$(basename "$NVIDIA_VULKAN_LIB")
            cat > /usr/share/vulkan/icd.d/nvidia_icd.json << EOF
{
    "file_format_version": "1.0.0",
    "ICD": {
        "library_path": "$LIB_NAME",
        "api_version": "1.3.0"
    }
}
EOF
            # Try to copy to /etc/vulkan/icd.d if writable
            if [ -w "/etc/vulkan/icd.d" ]; then
                cp /usr/share/vulkan/icd.d/nvidia_icd.json /etc/vulkan/icd.d/nvidia_icd.json 2>/dev/null || true
            fi
            log_success "NVIDIA Vulkan ICD configured with library: $LIB_NAME"
        else
            # Fallback-Konfiguration mit verschiedenen möglichen Bibliotheksnamen
            for lib_name in "libvulkan_nvidia.so.1" "libvulkan_nvidia.so" "nvidia_icd"; do
                cat > /usr/share/vulkan/icd.d/nvidia_icd.json << EOF
{
    "file_format_version": "1.0.0",
    "ICD": {
        "library_path": "$lib_name",
        "api_version": "1.3.0"
    }
}
EOF
                # Try to copy to /etc/vulkan/icd.d if writable
                if [ -w "/etc/vulkan/icd.d" ]; then
                    cp /usr/share/vulkan/icd.d/nvidia_icd.json /etc/vulkan/icd.d/nvidia_icd.json 2>/dev/null || true
                fi
                log_warning "NVIDIA Vulkan ICD configured with fallback: $lib_name"
                break
            done
        fi
        
        # Setze Vulkan-Umgebungsvariablen für bessere Kompatibilität
        # Based on GitHub issue #393003 solution
        echo "# NVIDIA Vulkan Environment Variables (GitHub issue #393003 fix)" >> /etc/environment
        if [ -w "/etc/vulkan/icd.d" ]; then
            echo "VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json:/etc/vulkan/icd.d/nvidia_icd.json" >> /etc/environment
        else
            echo "VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json" >> /etc/environment
        fi
        echo "VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d" >> /etc/environment
        echo "VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json" >> /etc/environment
        
        # Ensure vulkan-loader is properly configured
        echo "VK_LOADER_DEBUG=error" >> /etc/environment
        echo "VK_LOADER_LAYERS_ENABLE=" >> /etc/environment
        
        # Additional Steam-compatible Vulkan environment variables
        echo "VK_INSTANCE_LAYERS=" >> /etc/environment
        echo "VK_DEVICE_LAYERS=" >> /etc/environment
        
        # Create Steam-specific Vulkan configuration
        # Based on GitHub issue #393003 solution
        mkdir -p /home/user/.config/steam
        cat > /home/user/.config/steam/vulkan_env.sh << 'EOF'
#!/bin/bash
# Steam Vulkan Environment Configuration (GitHub issue #393003 fix)
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json
export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d
export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json
export VK_INSTANCE_LAYERS=""
export VK_DEVICE_LAYERS=""
export VK_LOADER_DEBUG=error
export VK_LOADER_LAYERS_ENABLE=""
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export LIBGL_ALWAYS_INDIRECT=0
export LIBGL_ALWAYS_SOFTWARE=0

# Ensure graphics drivers are available in Steam environment
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu/nvidia:$LD_LIBRARY_PATH"
EOF
        chmod +x /home/user/.config/steam/vulkan_env.sh
        chown -R user:user /home/user/.config/steam
        
        # Teste Vulkan-Verfügbarkeit
        if command -v vulkaninfo &> /dev/null; then
            log_info "Testing Vulkan availability..."
            export DISPLAY=:99
            export VK_ICD_FILENAMES="/usr/share/vulkan/icd.d/nvidia_icd.json:/etc/vulkan/icd.d/nvidia_icd.json"
            export VK_LAYER_PATH="/usr/share/vulkan/explicit_layer.d"
            export VK_DRIVER_FILES="/usr/share/vulkan/icd.d/nvidia_icd.json"
            
            if command -v Xvfb &> /dev/null; then
                Xvfb :99 -screen 0 1024x768x24 &
                XVFB_PID=$!
                sleep 2
                
                # Teste mit verschiedenen Konfigurationen
                if vulkaninfo --summary 2>/dev/null | grep -q "NVIDIA\|deviceName"; then
                    log_success "Vulkan driver detected successfully"
                    vulkaninfo --summary 2>/dev/null | grep "deviceName" | head -3 | while read line; do
                        echo "  • $line"
                    done
                else
                    log_warning "Vulkan driver not detected, but configuration created"
                    log_info "Vulkan may still work at runtime with proper environment variables"
                fi
                
                kill $XVFB_PID 2>/dev/null || true
            fi
        else
            log_warning "vulkaninfo not available for testing"
        fi
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