#!/bin/bash

# Set up environment
export DISPLAY=:0
export PULSE_RUNTIME_PATH=/run/user/1000/pulse
export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"

# Create required directories with proper permissions
sudo mkdir -p /run/user/1000/pulse /run/user/1000/bus
sudo chown -R steam:steam /run/user/1000
sudo chmod -R 700 /run/user/1000

# Clean up any existing X server
sudo killall Xvfb || true
sudo rm -f /tmp/.X0-lock

# Start DBus daemon with proper permissions
dbus-daemon --session --address="$DBUS_SESSION_BUS_ADDRESS" --fork

# Start virtual display with specific resolution
Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2

# Initialize NVIDIA X Server Settings
sudo nvidia-xconfig --allow-empty-initial-configuration \
  --use-display-device=None \
  --virtual=1920x1080 \
  --force-generate \
  --enable-all-gpus

# Start window manager
openbox-session &
sleep 2

# Start VNC server
x11vnc -display :0 -nopw -forever -shared -noxdamage -rfbport 7300 &

# Start PulseAudio
pulseaudio --start --exit-idle-time=-1
sleep 2

# Start Steam in Big Picture Mode
sudo -u steam /usr/games/steam -bigpicture &
sleep 5

# Start Sunshine with proper configuration
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sunshine &

# Keep container running
tail -f /dev/null 