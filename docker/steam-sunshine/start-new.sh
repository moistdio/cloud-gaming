#!/bin/bash

# Set up environment
export DISPLAY=:0
export HOME=/home/steam
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=all
export XAUTHORITY=/home/steam/.Xauthority

# Get port configuration from environment variables
VNC_PORT=${VNC_PORT:-5900}
SUNSHINE_PORT=${SUNSHINE_PORT:-7000}

echo "=== NEW SCRIPT STARTING ==="
echo "Starting with VNC_PORT=${VNC_PORT} and SUNSHINE_PORT=${SUNSHINE_PORT}"
echo "==========================="

# Clean up any existing processes and sockets
sudo pkill -f "Xvfb\|sunshine\|steam\|x11vnc\|pulseaudio\|dbus-daemon" || true
sudo rm -f /tmp/.X0-lock /tmp/.X11-unix/X0 /home/steam/.Xauthority

# Fix NVIDIA device permissions
sudo chmod 666 /dev/nvidia* || true

# Create X11 configuration
cat > /etc/X11/xorg.conf << EOF
Section "ServerLayout"
    Identifier     "Layout0"
    Screen      0  "Screen0"
EndSection

Section "Screen"
    Identifier     "Screen0"
    Device         "Device0"
    DefaultDepth    24
    Option         "AllowEmptyInitialConfiguration" "True"
    SubSection     "Display"
        Depth       24
        Virtual     1920 1080
    EndSubSection
EndSection

Section "Device"
    Identifier     "Device0"
    Driver         "nvidia"
    Option         "UseDisplayDevice" "None"
    Option         "AllowEmptyInitialConfiguration" "True"
EndSection

Section "Monitor"
    Identifier     "Monitor0"
    Option         "Primary" "true"
EndSection
EOF

# Start virtual display with specific resolution and GPU support
echo "Starting Xvfb..."
Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
sleep 3

# Generate and set up Xauthority
xauth generate :0 . trusted
xauth add ${HOST}:0 . $(mcookie)

# Start window manager
echo "Starting window manager..."
mkdir -p /home/steam/.config/openbox
openbox &
sleep 2

# Start VNC server with dynamic port
echo "Starting VNC server on port ${VNC_PORT}"
x11vnc -display :0 -nopw -forever -shared -repeat -listen 0.0.0.0 -rfbport ${VNC_PORT} &
sleep 2

# Start Steam in Big Picture Mode
echo "Starting Steam..."
/usr/games/steam -bigpicture -fulldesktopres &
sleep 5

# Create dynamic Sunshine configuration
echo "Creating Sunshine config for port ${SUNSHINE_PORT}"
mkdir -p /home/steam/.config/sunshine
cat > /home/steam/.config/sunshine/sunshine.conf << EOF
port = ${SUNSHINE_PORT}
fps = 60
adapter_name = NVIDIA
output_name = Virtual Display
audio_sink = default
encoder = nvenc,vaapi,software
hevc_mode = 0
gamepad = x360
EOF

# Start Sunshine with dynamic configuration
echo "Starting Sunshine on port ${SUNSHINE_PORT}"
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sunshine /home/steam/.config/sunshine/sunshine.conf &

echo "=== ALL SERVICES STARTED ==="
echo "VNC should be on port ${VNC_PORT}"
echo "Sunshine should be on port ${SUNSHINE_PORT}"
echo "============================="

# Keep container running and log output
exec tail -f /dev/null 