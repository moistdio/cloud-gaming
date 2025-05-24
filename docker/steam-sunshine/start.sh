#!/bin/bash

# Set up environment
export DISPLAY=:0
export PULSE_RUNTIME_PATH=/run/user/1000/pulse
export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=all

# Create required directories with proper permissions
sudo mkdir -p /run/user/1000/pulse /run/user/1000/bus
sudo chown -R steam:steam /run/user/1000
sudo chmod -R 700 /run/user/1000

# Clean up any existing processes
sudo killall Xvfb sunshine steam x11vnc || true
sudo rm -f /tmp/.X0-lock /tmp/.X11-unix/X0

# Start DBus daemon with proper permissions
dbus-daemon --session --address="$DBUS_SESSION_BUS_ADDRESS" --fork

# Start virtual display with specific resolution and GPU support
Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2

# Initialize NVIDIA X Server Settings
sudo nvidia-xconfig --allow-empty-initial-configuration \
  --use-display-device=None \
  --virtual=1920x1080 \
  --force-generate \
  --enable-all-gpus \
  --busid="PCI:0:2:0"

# Ensure proper permissions for devices
sudo chmod 666 /dev/nvidia* || true
sudo chmod 666 /dev/input/* || true

# Start window manager
openbox-session &
sleep 2

# Start VNC server with better performance settings
x11vnc -display :0 -nopw -forever -shared -noxdamage -rfbport 7300 -ncache 10 -ncache_cr &

# Start PulseAudio
pulseaudio --start --exit-idle-time=-1 --system --disallow-module-loading=0
sleep 2

# Start Steam in Big Picture Mode
sudo -u steam /usr/games/steam -bigpicture -fulldesktopres &
sleep 5

# Start Sunshine with proper configuration and GPU support
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sunshine --creds /home/steam/.config/sunshine/sunshine.conf &

# Keep container running and log output
exec tail -f /dev/null 