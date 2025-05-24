#!/bin/bash

# Set up environment
export DISPLAY=:0
export HOME=/home/steam
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=all

# Clean up any existing processes and sockets
sudo pkill -9 -u steam Xvfb sunshine steam x11vnc pulseaudio dbus-daemon || true
sudo rm -f /tmp/.X0-lock /tmp/.X11-unix/X0

# Fix NVIDIA device permissions
sudo chmod 666 /dev/nvidia* || true

# Start virtual display with specific resolution and GPU support
Xvfb :0 -screen 0 ${XVFB_WHD:-1920x1080x24} -ac +extension GLX +render -noreset &
sleep 2

# Initialize NVIDIA X Server Settings
sudo nvidia-xconfig --allow-empty-initial-configuration \
  --use-display-device=None \
  --virtual=1920x1080 \
  --force-generate \
  --enable-all-gpus \
  --busid="PCI:0:4:0" 2>/dev/null || true

# Start window manager
openbox-session &
sleep 2

# Start VNC server with correct port and binding
x11vnc -display :0 -nopw -forever -shared -noxdamage -listen 0.0.0.0 -rfbport 7300 -ncache 10 -ncache_cr &
sleep 2

# Start Steam in Big Picture Mode
/usr/games/steam -bigpicture -fulldesktopres &
sleep 5

# Start Sunshine with proper configuration
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sunshine /home/steam/.config/sunshine/sunshine.conf &

# Keep container running and log output
exec tail -f /dev/null 