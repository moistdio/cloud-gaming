#!/bin/bash

# Umgebungsvariablen setzen
export DISPLAY=${DISPLAY:-:1}
export VNC_PORT=${VNC_PORT:-5901}
export WEB_PORT=${WEB_PORT:-6081}

# VNC-Passwort setzen falls bereitgestellt
if [ ! -z "$VNC_PASSWORD" ]; then
    echo "$VNC_PASSWORD" | vncpasswd -f > ~/.vnc/passwd
    chmod 600 ~/.vnc/passwd
fi

# VNC-Server starten
echo "Starte VNC-Server auf Display $DISPLAY..."
vncserver $DISPLAY -geometry 1920x1080 -depth 24 -rfbport $VNC_PORT

# noVNC Web-Interface starten
echo "Starte noVNC Web-Interface auf Port $WEB_PORT..."
websockify --web=/usr/share/novnc/ $WEB_PORT localhost:$VNC_PORT &

# Warten auf VNC-Server
sleep 5

echo "Desktop-Container gestartet!"
echo "VNC-Verbindung: vnc://localhost:$VNC_PORT"
echo "Web-VNC: http://localhost:$WEB_PORT"

# Container am Leben halten
while true; do
    if ! pgrep -f "Xvnc.*$DISPLAY" > /dev/null; then
        echo "VNC-Server gestoppt, starte neu..."
        vncserver $DISPLAY -geometry 1920x1080 -depth 24 -rfbport $VNC_PORT
    fi
    
    if ! pgrep -f "websockify.*$WEB_PORT" > /dev/null; then
        echo "noVNC gestoppt, starte neu..."
        websockify --web=/usr/share/novnc/ $WEB_PORT localhost:$VNC_PORT &
    fi
    
    sleep 30
done 