#!/bin/bash

# Create runtime directory
mkdir -p $XDG_RUNTIME_DIR
chmod 700 $XDG_RUNTIME_DIR

# Start X server
echo "Starting X server..."
Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
export DISPLAY=:0

# Wait for X server to start
sleep 2

# Start window manager
echo "Starting window manager..."
fluxbox &

# Start PulseAudio
echo "Starting PulseAudio..."
pulseaudio --start --log-target=syslog

# Start VNC server (accessible from outside)
echo "Starting VNC server..."
x11vnc -display :0 -nopw -listen 0.0.0.0 -xkb -ncache 10 -ncache_cr -forever &

# Simple HTTP server for health checks
echo "Starting simple HTTP server..."
python3 -m http.server 47989 &

echo "Streaming service is running (simplified mode)"
echo "VNC available on port 5900 (accessible externally)"
echo "HTTP server on port 47989"

# Keep container running
tail -f /dev/null 