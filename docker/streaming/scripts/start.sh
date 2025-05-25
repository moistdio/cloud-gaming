#!/bin/bash

# Create runtime directory
mkdir -p $XDG_RUNTIME_DIR
chmod 700 $XDG_RUNTIME_DIR

# Clean up any existing X server lock files
rm -f /tmp/.X0-lock

# Start X server
echo "Starting X server..."
Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
export DISPLAY=:0

# Wait for X server to start
sleep 3

# Verify X server is running
if ! xdpyinfo -display :0 >/dev/null 2>&1; then
    echo "ERROR: X server failed to start"
    exit 1
fi

# Start window manager
echo "Starting window manager..."
fluxbox &

# Start PulseAudio
echo "Starting PulseAudio..."
pulseaudio --start --log-target=syslog

# Start VNC server (accessible from outside)
echo "Starting VNC server..."
x11vnc -display :0 -nopw -listen 0.0.0.0 -xkb -ncache 10 -ncache_cr -forever &

# Configure Sunshine
mkdir -p /home/steam/.config/sunshine
cat > /home/steam/.config/sunshine/sunshine.conf << EOF
port = 47989
upnp = on
address_family = both
channels = 2
EOF

# Start Sunshine
echo "Starting Sunshine..."
sunshine --config /home/steam/.config/sunshine/sunshine.conf &

echo "Streaming service is running"
echo "VNC available on port 5900 (accessible externally)"
echo "Sunshine available on port 47989"

# Keep container running
tail -f /dev/null 