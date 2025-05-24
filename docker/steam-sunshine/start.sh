#!/bin/bash

# Set up environment
export DISPLAY=:0
export PULSE_RUNTIME_PATH=/run/user/1000/pulse
export XDG_RUNTIME_DIR=/run/user/1000
export DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/1000/bus"

# Create required directories
mkdir -p /run/user/1000/pulse
mkdir -p /run/user/1000/bus
chown -R steam:steam /run/user/1000

# Start DBus session
dbus-daemon --session --address="$DBUS_SESSION_BUS_ADDRESS" --nofork &
sleep 2

# Start virtual display
Xvfb :0 -screen 0 1920x1080x24 &
sleep 2

# Start window manager
openbox-session &
sleep 2

# Start VNC server
x11vnc -display :0 -nopw -forever -shared -noxdamage &

# Start PulseAudio
pulseaudio --start --exit-idle-time=-1

# Initialize NVIDIA X Server Settings
sudo nvidia-xconfig --allow-empty-initial-configuration --use-display-device=None --virtual=1920x1080 --force-generate

# Start Steam in Big Picture Mode
sudo -u steam /usr/games/steam -bigpicture &

# Wait for Steam to initialize
sleep 5

# Start Sunshine with correct environment
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sudo -u steam sunshine &

# Keep container running
tail -f /dev/null 