#!/bin/bash

# Cloud Gaming Desktop - Start Script
# Startet VNC-Server und noVNC für Remote-Desktop-Zugriff

set -e

echo "🖥️ Starting Cloud Gaming Desktop..."

# Enable user namespaces for Steam and other applications
echo "🔧 Enabling user namespaces for Steam compatibility..."
if echo 1 > /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null; then
    echo "✅ User namespaces enabled successfully"
else
    echo "⚠️ Could not enable user namespaces via sysctl, trying alternative approach..."
    # Alternative: Use --no-sandbox flag for Steam
    export STEAM_EXTRA_FLAGS="--no-sandbox --disable-seccomp-filter-sandbox"
    echo "✅ Steam will run with sandbox disabled"
fi

# Setup PulseAudio for Steam audio
echo "🔊 Setting up PulseAudio for Steam..."

# Create system-wide PulseAudio configuration
cat > /etc/pulse/system.pa << 'EOF'
#!/usr/bin/pulseaudio -nF
# System-wide PulseAudio configuration

# Load null sink for dummy audio
load-module module-null-sink sink_name=dummy sink_properties=device.description="Dummy_Output"

# Load native protocol with no authentication
load-module module-native-protocol-unix auth-anonymous=1 socket=/tmp/pulse-native

# Set default sink
set-default-sink dummy
EOF

# Create client configuration to disable authentication
cat > /etc/pulse/client.conf << 'EOF'
# System-wide client configuration
default-server = unix:/tmp/pulse-native
autospawn = no
EOF

# Create user client configuration
mkdir -p /home/user/.config/pulse
cat > /home/user/.config/pulse/client.conf << 'EOF'
# User client configuration
default-server = unix:/tmp/pulse-native
autospawn = no
EOF
chown -R user:user /home/user/.config/pulse

# Set PulseAudio environment variables
export PULSE_SERVER="unix:/tmp/pulse-native"

# Start PulseAudio in system mode with no authentication
echo "🎵 Starting PulseAudio in system mode..."
pulseaudio --system --disallow-exit --disallow-module-loading=false --disable-shm --log-target=stderr &

# Wait for PulseAudio to start
sleep 3

# Test PulseAudio connection
if pulseaudio --check -v; then
    echo "✅ PulseAudio started successfully"
else
    echo "⚠️ PulseAudio may have issues, but continuing..."
fi

# GPU-Initialisierung ausführen
echo "🎮 Initializing GPU hardware..."
if [ -f "/usr/local/bin/gpu-init.sh" ]; then
    /usr/local/bin/gpu-init.sh
else
    echo "⚠️ GPU initialization script not found, continuing without GPU acceleration"
fi

# Umgebungsvariablen mit Standardwerten
VNC_PORT=${VNC_PORT:-11000}
WEB_VNC_PORT=${WEB_VNC_PORT:-12000}
USER_ID=${USER_ID:-1000}
DISPLAY=${DISPLAY:-:1}
VNC_PASSWORD=${VNC_PASSWORD:-cloudgaming}

echo "📊 Configuration:"
echo "  VNC Port: $VNC_PORT"
echo "  Web VNC Port: $WEB_VNC_PORT"
echo "  Display: $DISPLAY"
echo "  User ID: $USER_ID"
echo "  Port Range: VNC 11000-11430, Web 12000-12430"

# GPU-Status anzeigen
if [ -f "/tmp/gpu_info.json" ]; then
    echo "🎮 GPU Status:"
    GPU_NAME=$(cat /tmp/gpu_info.json | grep '"gpu_name"' | cut -d'"' -f4)
    GPU_MEMORY=$(cat /tmp/gpu_info.json | grep '"gpu_memory"' | cut -d'"' -f4)
    echo "  GPU: $GPU_NAME"
    echo "  Memory: ${GPU_MEMORY}MB"
fi

# Funktion zum Aktualisieren des VNC-Passworts
update_vnc_password() {
    local new_password="$1"
    echo "🔐 Updating VNC password..."
    
    # VNC-Passwort-Datei aktualisieren
    echo "$new_password" | vncpasswd -f > /home/user/.vnc/passwd
    chmod 600 /home/user/.vnc/passwd
    chown user:user /home/user/.vnc/passwd
    
    echo "✅ VNC password updated successfully"
}

# Funktion zum Überwachen von Passwort-Änderungen
monitor_password_changes() {
    while true; do
        # Prüfe ob eine neue Passwort-Datei existiert
        if [ -f /tmp/new_vnc_password ]; then
            local new_password=$(cat /tmp/new_vnc_password)
            if [ ! -z "$new_password" ] && [ "$new_password" != "$VNC_PASSWORD" ]; then
                echo "🔄 New password detected, updating..."
                update_vnc_password "$new_password"
                VNC_PASSWORD="$new_password"
                
                # Temporäre Datei löschen
                rm -f /tmp/new_vnc_password
                
                echo "📢 Password updated. New password: $new_password"
            fi
        fi
        sleep 10
    done
}

# Benutzer erstellen falls nicht vorhanden
if ! id -u user >/dev/null 2>&1; then
    echo "👤 Creating user..."
    useradd -m -u $USER_ID -s /bin/bash user
    echo "user:$VNC_PASSWORD" | chpasswd
    # Benutzer zur sudo-Gruppe hinzufügen
    usermod -aG sudo user
fi

# VNC-Verzeichnis erstellen
mkdir -p /home/user/.vnc
chown -R user:user /home/user/.vnc

# VNC-Passwort setzen
echo "🔐 Setting VNC password..."
update_vnc_password "$VNC_PASSWORD"

# X-Server Konfiguration
echo "🖼️ Configuring X-Server..."
export DISPLAY=$DISPLAY

# VNC-Server Konfiguration
cat > /home/user/.vnc/xstartup << EOF
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
export XDG_CURRENT_DESKTOP="XFCE"
export XDG_SESSION_DESKTOP="XFCE"

# GPU-spezifische Umgebungsvariablen
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=all
export LIBGL_ALWAYS_INDIRECT=0
export LIBGL_ALWAYS_SOFTWARE=0

# OpenGL und Hardware-Beschleunigung aktivieren
export __GL_SYNC_TO_VBLANK=1
export __GL_YIELD="USLEEP"
export VDPAU_DRIVER=nvidia

# NVIDIA GLX-spezifische Umgebungsvariablen (CRITICAL for hardware acceleration)
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export __GL_SHADER_DISK_CACHE=1
export __GL_THREADED_OPTIMIZATIONS=1

# Steam-spezifische Umgebungsvariablen
export STEAM_COMPAT_CLIENT_INSTALL_PATH=/home/user/.steam
export STEAM_COMPAT_DATA_PATH=/home/user/.steam/steam
export PULSE_SERVER="unix:/tmp/pulse-native"

# Steam sandbox fallback flags (set during user namespace check)
if [ ! -z "$STEAM_EXTRA_FLAGS" ]; then
    export STEAM_EXTRA_FLAGS="$STEAM_EXTRA_FLAGS"
fi

# Vulkan-Support (enhanced for better compatibility)
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json:/etc/vulkan/icd.d/nvidia_icd.json:/usr/share/vulkan/icd.d/radeon_icd.x86_64.json:/usr/share/vulkan/icd.d/intel_icd.x86_64.json
export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d
export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json

# CUDA-Pfade
export PATH=/usr/local/cuda/bin:\$PATH
export LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/lib/x86_64-linux-gnu/nvidia:\$LD_LIBRARY_PATH

# Start XFCE4 Desktop with GPU acceleration via VirtualGL (if available)
if command -v vglrun >/dev/null 2>&1; then
    echo "Starting XFCE4 with VirtualGL acceleration..."
    vglrun startxfce4 &
else
    echo "VirtualGL not available, starting XFCE4 normally..."
    startxfce4 &
fi
EOF

chmod +x /home/user/.vnc/xstartup
chown user:user /home/user/.vnc/xstartup

# VNC-Server starten (als root, dann ownership ändern)
echo "🚀 Starting VNC Server on port $VNC_PORT..."

# Stop any existing X servers and VNC processes
pkill -f "Xvfb $DISPLAY" 2>/dev/null || true
pkill -f "x11vnc.*$VNC_PORT" 2>/dev/null || true
vncserver -kill $DISPLAY 2>/dev/null || true

# VNC-Server als user starten mit GPU-Unterstützung
# Erstelle Xorg-Konfiguration für GPU
cat > /tmp/xorg.conf << EOF
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
        Modes "1920x1080"
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

Section "Extensions"
    Option "GLX" "Enable"
EndSection
EOF

# Start Xvfb with GLX support for GPU acceleration
echo "🚀 Starting Xvfb with GLX support..."
Xvfb $DISPLAY -screen 0 1920x1080x24 +extension GLX +extension RENDER +extension RANDR &
XVFB_PID=$!

# Wait for Xvfb to start
sleep 2

# Start window manager as user
sudo -u user DISPLAY=$DISPLAY /home/user/.vnc/xstartup &

# Initialize Steam environment for first-time use
echo "🎮 Setting up Steam environment..."
# Ensure Steam directories exist with proper permissions
sudo -u user mkdir -p /home/user/.steam /home/user/.local/share/Steam /home/user/.config/steam
sudo -u user bash -c "
export HOME=/home/user
export STEAM_COMPAT_CLIENT_INSTALL_PATH=/home/user/.steam
export STEAM_RUNTIME=1
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export PULSE_SERVER='unix:/tmp/pulse-native'
# Create basic Steam config if it doesn't exist
if [ ! -f /home/user/.steam/config/config.vdf ]; then
    mkdir -p /home/user/.steam/config
    echo 'Steam environment ready for first use'
fi
" &

# Start x11vnc to provide VNC access to the Xvfb display
echo "🚀 Starting x11vnc on port $VNC_PORT..."
x11vnc -display $DISPLAY -rfbport $VNC_PORT -passwd $VNC_PASSWORD -shared -forever -noxdamage -noxfixes -noxcomposite -bg

# noVNC Web-Interface starten
echo "🌐 Starting noVNC Web Interface on port $WEB_VNC_PORT..."
cd /opt/noVNC

# noVNC Konfiguration
cat > /tmp/novnc_config.js << EOF
var websockify_port = $WEB_VNC_PORT;
var vnc_host = 'localhost';
var vnc_port = $VNC_PORT;
EOF

# WebSocket-Proxy starten (verbindet noVNC mit VNC-Server)
./utils/novnc_proxy --vnc localhost:$VNC_PORT --listen $WEB_VNC_PORT &

# Passwort-Monitor im Hintergrund starten
monitor_password_changes &

# Health-Check-Funktion
health_check() {
    # Prüfe VNC-Server
    if ! netstat -ln | grep -q ":$VNC_PORT "; then
        echo "❌ VNC Server not running on port $VNC_PORT"
        return 1
    fi
    
    # Prüfe noVNC
    if ! netstat -ln | grep -q ":$WEB_VNC_PORT "; then
        echo "❌ noVNC not running on port $WEB_VNC_PORT"
        return 1
    fi
    
    echo "✅ All services running"
    return 0
}

# Warten bis Services bereit sind
echo "⏳ Waiting for services to start..."
sleep 5

# Health-Check durchführen
if health_check; then
    echo "🎉 Cloud Gaming Desktop successfully started!"
    echo ""
    echo "📋 Connection Information:"
    echo "  VNC Client: localhost:$VNC_PORT"
    echo "  Web Browser: http://localhost:$WEB_VNC_PORT"
    echo "  Password: $VNC_PASSWORD"
    echo ""
    echo "💡 To update password: echo 'newpassword' > /tmp/new_vnc_password"
    echo ""
else
    echo "❌ Failed to start services"
    exit 1
fi

# Log-Funktion für kontinuierliche Ausgabe
log_services() {
    while true; do
        echo "$(date): Desktop services running (VNC: $VNC_PORT, Web: $WEB_VNC_PORT)"
        sleep 300  # Alle 5 Minuten
    done
}

# Kontinuierliche Logs starten
log_services &

# Signal-Handler für graceful shutdown
cleanup() {
    echo "🛑 Shutting down Cloud Gaming Desktop..."
    
    # Stop Xvfb and x11vnc
    pkill -f "Xvfb $DISPLAY" || true
    pkill -f "x11vnc.*$VNC_PORT" || true
    
    # Stop legacy VNC server (if any)
    sudo -u user HOME=/home/user vncserver -kill $DISPLAY || true
    
    # Stop noVNC
    pkill -f novnc_proxy || true
    
    # Stop password monitor
    pkill -f monitor_password_changes || true
    
    # Stop PulseAudio properly
    pkill pulseaudio || true
    rm -f /tmp/pulse-native || true
    
    echo "✅ Shutdown complete"
    exit 0
}

# Signal-Handler registrieren
trap cleanup SIGTERM SIGINT

# Hauptprozess am Leben halten
echo "🔄 Desktop is ready. Keeping services alive..."
while true; do
    # Periodischer Health-Check
    if ! health_check; then
        echo "⚠️ Service check failed, attempting restart..."
        
        # Restart X server and VNC if needed
        if ! netstat -ln | grep -q ":$VNC_PORT "; then
            echo "🔄 Restarting X server and VNC..."
            # Stop any existing processes
            pkill -f "Xvfb $DISPLAY" || true
            pkill -f "x11vnc.*$VNC_PORT" || true
            
            # Start Xvfb with GLX support
            Xvfb $DISPLAY -screen 0 1920x1080x24 +extension GLX +extension RENDER +extension RANDR &
            sleep 2
            
            # Start window manager
            sudo -u user DISPLAY=$DISPLAY /home/user/.vnc/xstartup &
            
            # Start x11vnc
            x11vnc -display $DISPLAY -rfbport $VNC_PORT -passwd $VNC_PASSWORD -shared -forever -noxdamage -noxfixes -noxcomposite -bg
        fi
        
        # noVNC neu starten falls nötig
        if ! netstat -ln | grep -q ":$WEB_VNC_PORT "; then
            echo "🔄 Restarting noVNC..."
            cd /opt/noVNC
            ./utils/novnc_proxy --vnc localhost:$VNC_PORT --listen $WEB_VNC_PORT &
        fi
    fi
    
    sleep 30
done 