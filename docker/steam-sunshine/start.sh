#!/bin/bash

# Create PulseAudio socket directory
mkdir -p /run/user/1000/pulse
chown -R steam:steam /run/user/1000

# Set up virtual display
export DISPLAY=:0
Xvfb :0 -screen 0 1920x1080x24 &
sleep 2

# Start window manager
openbox-session &
sleep 2

# Start VNC server for debugging (optional)
x11vnc -display :0 -nopw -forever -shared &

# Start PulseAudio with correct socket path
export PULSE_RUNTIME_PATH=/run/user/1000/pulse
pulseaudio --start --exit-idle-time=-1

# Initialize NVIDIA X Server Settings
sudo nvidia-xconfig --allow-empty-initial-configuration --use-display-device=None --virtual=1920x1080 --force-generate

# Start Steam in Big Picture Mode
/usr/games/steam -bigpicture &

# Wait for Steam to initialize
sleep 5

# Start Sunshine with correct library path
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
/usr/bin/sunshine &

# Keep container running
tail -f /dev/null 