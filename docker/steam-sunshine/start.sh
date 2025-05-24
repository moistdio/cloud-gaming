#!/bin/bash

# Set up environment
export DISPLAY=:0
export PULSE_RUNTIME_PATH=/run/user/1000/pulse
export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=all

# Clean up any existing processes and sockets
pkill -9 -u steam Xvfb sunshine steam x11vnc pulseaudio dbus-daemon || true
rm -f /tmp/.X0-lock /tmp/.X11-unix/X0
rm -f /run/user/1000/pulse/* /run/user/1000/bus

# Create required directories with proper permissions
mkdir -p /run/user/1000/pulse /run/user/1000/bus
chown -R steam:steam /run/user/1000
chmod -R 700 /run/user/1000

# Start DBus daemon as steam user
sudo -u steam dbus-daemon --session --address="$DBUS_SESSION_BUS_ADDRESS" --fork

# Start virtual display with specific resolution and GPU support
sudo -u steam Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 2

# Initialize NVIDIA X Server Settings (skip chmod errors)
nvidia-xconfig --allow-empty-initial-configuration \
  --use-display-device=None \
  --virtual=1920x1080 \
  --force-generate \
  --enable-all-gpus 2>/dev/null || true

# Start window manager as steam user
sudo -u steam openbox-session &
sleep 2

# Start VNC server with correct port
sudo -u steam x11vnc -display :0 -nopw -forever -shared -noxdamage -rfbport 5900 -ncache 10 -ncache_cr &

# Start PulseAudio as steam user
sudo -u steam pulseaudio --start --exit-idle-time=-1 --disallow-module-loading=0
sleep 2

# Start Steam in Big Picture Mode
sudo -u steam /usr/games/steam -bigpicture -fulldesktopres &
sleep 5

# Start Sunshine with proper configuration
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sudo -u steam sunshine /home/steam/.config/sunshine/sunshine.conf &

# Keep container running and log output
exec tail -f /dev/null 