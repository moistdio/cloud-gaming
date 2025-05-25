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

# Clean up any existing processes and sockets
sudo pkill -9 -u steam Xvfb sunshine steam x11vnc pulseaudio dbus-daemon || true
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
Xvfb :0 -screen 0 ${XVFB_WHD:-1920x1080x24} -ac +extension GLX +render -noreset &
sleep 2

# Generate and set up Xauthority
xauth generate :0 . trusted
xauth add ${HOST}:0 . $(mcookie)

# Start window manager with specific configuration
mkdir -p /home/steam/.config/openbox
cat > /home/steam/.config/openbox/autostart << EOF
# Set a solid gray background for better visibility
xsetroot -solid gray
# Ensure proper X initialization
xrandr --auto
EOF

chmod +x /home/steam/.config/openbox/autostart
openbox --config-file /home/steam/.config/openbox/autostart &
sleep 2

# Start VNC server with dynamic port
x11vnc -display :0 -nopw -forever -shared -repeat -noxdamage -noxfixes -noxrecord -listen 0.0.0.0 -rfbport ${VNC_PORT} -ncache 10 -ncache_cr -scale 1920x1080 &
sleep 2

# Start Steam in Big Picture Mode
/usr/games/steam -bigpicture -fulldesktopres &
sleep 5

# Create dynamic Sunshine configuration
mkdir -p /home/steam/.config/sunshine
cat > /home/steam/.config/sunshine/sunshine.conf << EOF
# Sunshine Configuration

# Network settings
port = ${SUNSHINE_PORT}

# Display settings
fps = 60
adapter_name = NVIDIA
output_name = Virtual Display

# Audio settings
audio_sink = default

# Encoder settings
encoder = nvenc,vaapi,software
hevc_mode = 0

# Input settings
gamepad = x360

# Application settings
apps = [
  {
    name = "Steam"
    cmd = "steam -bigpicture"
    detached = ["steam"]
    image-path = "/home/steam/.local/share/icons/steam.png"
  }
]
EOF

# Start Sunshine with dynamic configuration
export LD_LIBRARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
sunshine /home/steam/.config/sunshine/sunshine.conf &

# Keep container running and log output
exec tail -f /dev/null 