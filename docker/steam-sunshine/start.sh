#!/bin/bash

# Set up virtual display
export DISPLAY=:0
Xvfb :0 -screen 0 1920x1080x24 &
sleep 2

# Start window manager
openbox-session &
sleep 2

# Start VNC server for debugging (optional)
x11vnc -display :0 -nopw -forever -shared &

# Start PulseAudio
pulseaudio --start

# Initialize NVIDIA X Server Settings with sudo
sudo nvidia-xconfig --allow-empty-initial-configuration --use-display-device=None --virtual=1920x1080

# Start Steam in Big Picture Mode (with full path)
/usr/games/steam -bigpicture &

# Start Sunshine (with full path)
/usr/bin/sunshine &

# Keep container running
tail -f /dev/null 