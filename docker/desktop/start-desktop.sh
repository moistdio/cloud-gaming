#!/bin/bash

# Cloud Gaming Desktop - Start Script
# Startet VNC-Server und noVNC für Remote-Desktop-Zugriff

set -e

echo "🖥️ Starting Cloud Gaming Desktop..."

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
echo "$VNC_PASSWORD" | vncpasswd -f > /home/user/.vnc/passwd
chmod 600 /home/user/.vnc/passwd
chown user:user /home/user/.vnc/passwd

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

# Start XFCE4 Desktop
startxfce4 &
EOF

chmod +x /home/user/.vnc/xstartup
chown user:user /home/user/.vnc/xstartup

# VNC-Server starten (als root, dann ownership ändern)
echo "🚀 Starting VNC Server on port $VNC_PORT..."

# Zuerst alle bestehenden VNC-Server stoppen
vncserver -kill $DISPLAY 2>/dev/null || true

# VNC-Server als user starten mit sudo (korrigierte Syntax)
sudo -u user HOME=/home/user vncserver $DISPLAY -geometry 1920x1080 -depth 24 -rfbport $VNC_PORT

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
    
    # VNC-Server stoppen
    sudo -u user HOME=/home/user vncserver -kill $DISPLAY || true
    
    # noVNC stoppen
    pkill -f novnc_proxy || true
    
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
        
        # VNC-Server neu starten falls nötig
        if ! netstat -ln | grep -q ":$VNC_PORT "; then
            echo "🔄 Restarting VNC Server..."
            sudo -u user HOME=/home/user vncserver $DISPLAY -geometry 1920x1080 -depth 24 -rfbport $VNC_PORT
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