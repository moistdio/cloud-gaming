#!/bin/bash

# Set up environment
export DISPLAY=:0
export PULSE_RUNTIME_PATH=/run/user/1000/pulse
export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=all

# Clean up any existing processes and sockets
sudo pkill -9 -u steam Xvfb sunshine steam x11vnc pulseaudio dbus-daemon || true
sudo rm -f /tmp/.X0-lock /tmp/.X11-unix/X0
sudo rm -f /run/user/1000/pulse/* /run/user/1000/bus

# Create required directories with proper permissions
sudo mkdir -p /run/user/1000/pulse /run/user/1000/bus
sudo chown -R steam:steam /run/user/1000
sudo chmod -R 700 /run/user/1000

# Fix NVIDIA device permissions
sudo chmod 666 /dev/nvidia* || true

# Start DBus daemon
dbus-daemon --session --address="$DBUS_SESSION_BUS_ADDRESS" --fork

# Start virtual display with specific resolution and GPU support
Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2

# Initialize NVIDIA X Server Settings
sudo nvidia-xconfig --allow-empty-initial-configuration \
  --use-display-device=None \
  --virtual=1920x1080 \
  --force-generate \
  --enable-all-gpus 2>/dev/null || true

# Start window manager
openbox-session &
sleep 2

# Start VNC server with correct port and binding
x11vnc -display :0 -nopw -forever -shared -noxdamage -listen 0.0.0.0 -rfbport 5900 -ncache 10 -ncache_cr -noipv6 &

# Start PulseAudio
pulseaudio --start --exit-idle-time=-1 --disallow-module-loading=0
sleep 2

# Start Steam in Big Picture Mode
/usr/games/steam -bigpicture -fulldesktopres &
sleep 5

# Start Sunshine with proper configuration
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sunshine /home/steam/.config/sunshine/sunshine.conf &

# Keep container running and log output
exec tail -f /dev/null 