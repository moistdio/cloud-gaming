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

# Start VNC server (for debugging)
echo "Starting VNC server..."
x11vnc -display :0 -nopw -listen localhost -xkb -ncache 10 -ncache_cr -forever &

# Configure Sunshine
echo "Configuring Sunshine..."
if [ ! -f /home/steam/.config/sunshine/sunshine.conf ]; then
    cp /config/sunshine.conf /home/steam/.config/sunshine/
fi

# Start Sunshine
echo "Starting Sunshine..."
sunshine --config /home/steam/.config/sunshine/sunshine.conf

# Keep container running
tail -f /dev/null 