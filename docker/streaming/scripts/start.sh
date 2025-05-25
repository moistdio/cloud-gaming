#!/bin/bash

# Create runtime directory
mkdir -p $XDG_RUNTIME_DIR
chmod 700 $XDG_RUNTIME_DIR

# Clean up any existing X server lock files
rm -f /tmp/.X0-lock

# Start X server
echo "Starting X server..."
Xvfb :0 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
export DISPLAY=:0

# Wait for X server to start
sleep 3

# Verify X server is running
if ! xdpyinfo -display :0 >/dev/null 2>&1; then
    echo "ERROR: X server failed to start"
    exit 1
fi

# Configure Fluxbox
echo "Configuring Fluxbox..."
mkdir -p /home/steam/.fluxbox

# Create Fluxbox menu
cat > /home/steam/.fluxbox/menu << EOF
[begin] (CloudStream Desktop)
    [exec] (Terminal) {xterm}
    [exec] (Firefox) {firefox}
    [exec] (File Manager) {pcmanfm}
    [exec] (Text Editor) {gedit}
    [exec] (System Monitor) {xterm -e htop}
    [separator]
    [submenu] (Games)
        [exec] (Steam) {steam}
    [end]
    [separator]
    [restart] (Restart Fluxbox)
    [exit] (Exit)
[end]
EOF

# Create Fluxbox startup file
cat > /home/steam/.fluxbox/startup << EOF
#!/bin/bash
# Set desktop background color
xsetroot -solid "#2c3e50"

# Start a terminal automatically
xterm -geometry 80x24+100+100 &

# Start file manager in background
pcmanfm --desktop &

# Start fluxbox
exec fluxbox
EOF

chmod +x /home/steam/.fluxbox/startup

# Start window manager
echo "Starting window manager..."
fluxbox &

# Wait for window manager to start
sleep 2

# Start PulseAudio
echo "Starting PulseAudio..."
pulseaudio --start --log-target=syslog

# Start VNC server (accessible from outside)
echo "Starting VNC server..."
x11vnc -display :0 -nopw -listen 0.0.0.0 -xkb -ncache 10 -ncache_cr -forever &

# Configure Sunshine
mkdir -p /home/steam/.config/sunshine
cat > /home/steam/.config/sunshine/sunshine.conf << EOF
port = 47989
upnp = on
address_family = both
channels = 2
EOF

# Start Sunshine
echo "Starting Sunshine..."
sunshine --config /home/steam/.config/sunshine/sunshine.conf &

echo "Streaming service is running"
echo "VNC available on port 5900 (accessible externally)"
echo "Sunshine available on port 47989"
echo "Desktop configured with terminal, file manager, and applications"

# Keep container running
tail -f /dev/null 