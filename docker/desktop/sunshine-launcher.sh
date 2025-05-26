#!/bin/bash

# Sunshine Game Streaming Launcher
# Optimized for GPU-accelerated cloud gaming containers

echo "🌞 Starting Sunshine Game Streaming Server..."

# Set up environment variables for optimal performance
export DISPLAY=:1
export PULSE_RUNTIME_PATH=/tmp/pulse-runtime
export XDG_RUNTIME_DIR=/tmp/runtime-user

# GPU-specific environment variables
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=all
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export LIBGL_ALWAYS_INDIRECT=0
export LIBGL_ALWAYS_SOFTWARE=0

# Vulkan environment variables
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json
export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d
export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json

# Hardware encoding environment variables
export VAAPI_DEVICE=/dev/dri/renderD128
export VDPAU_DRIVER=nvidia

# Create runtime directories
mkdir -p $XDG_RUNTIME_DIR 2>/dev/null || true
chmod 700 $XDG_RUNTIME_DIR 2>/dev/null || true
mkdir -p $PULSE_RUNTIME_PATH 2>/dev/null || true

# Check if Sunshine config exists, create default if not
SUNSHINE_CONFIG_DIR="/home/user/.config/sunshine"
SUNSHINE_CONFIG_FILE="$SUNSHINE_CONFIG_DIR/sunshine.conf"

if [ ! -f "$SUNSHINE_CONFIG_FILE" ]; then
    echo "📝 Creating default Sunshine configuration..."
    mkdir -p "$SUNSHINE_CONFIG_DIR"
    
    cat > "$SUNSHINE_CONFIG_FILE" << EOF
# Sunshine Configuration for Cloud Gaming Container
# Optimized for containerized environment with display compatibility

# Network Configuration
address_family = both
port = ${SUNSHINE_BASE_PORT:-47984}
origin_web_ui_allowed = pc

# Display Configuration (CRITICAL for container environments)
output_name = :1.0
capture = x11

# Video Configuration - Force software encoding to avoid segfaults
encoder = software
sw_preset = ultrafast
sw_tune = zerolatency

# Disable hardware encoders that cause segfaults in containers
nvenc = disabled
vaapi = disabled
qsv = disabled

# Video quality settings (optimized for software encoding)
bitrate = 10000
fps = 30
min_threads = 2
crf = 23

# Audio Configuration
audio_sink = pulse

# Input Configuration - Disable virtual input devices that cause warnings
key_repeat_delay = 500
key_repeat_frequency = 24
gamepad = disabled
mouse = disabled
keyboard = disabled

# Security
username = user
password = sunshine

# Container-specific settings for X11 compatibility
x11_display = :1
force_software_encoding = true

# Logging for troubleshooting
min_log_level = info
log_path = /home/user/.config/sunshine/sunshine.log

# Disable features that may cause issues in containers
upnp = disabled
lan_encryption = disabled

# Performance optimizations for software encoding
threads = 0
slices = 1
qmin = 16
qmax = 51
EOF

    chown user:user "$SUNSHINE_CONFIG_FILE"
    echo "✅ Default configuration created at $SUNSHINE_CONFIG_FILE"
fi

# Check GPU availability
echo "🔍 Checking GPU availability..."
if command -v nvidia-smi >/dev/null 2>&1; then
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader,nounits 2>/dev/null || echo "⚠️  NVIDIA GPU detected but nvidia-smi failed"
else
    echo "⚠️  nvidia-smi not available"
fi

# Check Vulkan support
echo "🔍 Checking Vulkan support..."
if command -v vulkaninfo >/dev/null 2>&1; then
    vulkaninfo --summary 2>/dev/null | head -5 || echo "⚠️  Vulkan available but vulkaninfo failed"
else
    echo "⚠️  vulkaninfo not available"
fi

# Start PulseAudio if not running
if ! pgrep -x "pulseaudio" > /dev/null; then
    echo "🔊 Starting PulseAudio..."
    pulseaudio --start --log-target=syslog 2>/dev/null || echo "⚠️  PulseAudio start failed"
fi

# Wait for X11 to be ready
echo "🖥️  Waiting for X11 display..."
timeout=30
while [ $timeout -gt 0 ]; do
    if xdpyinfo -display :1 >/dev/null 2>&1; then
        echo "✅ X11 display ready"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ X11 display not ready after 30 seconds"
    exit 1
fi

# Additional display and encoder checks for Sunshine
echo "🔍 Performing Sunshine compatibility checks..."

# Check X11 display details
echo "📺 X11 Display Information:"
DISPLAY_INFO=$(xdpyinfo -display :1 2>/dev/null | grep -E "dimensions|resolution" | head -2)
if [ -n "$DISPLAY_INFO" ]; then
    echo "$DISPLAY_INFO" | sed 's/^/   /'
else
    echo "   ⚠️  Could not get display information"
fi

# Check for available encoders
echo "🎥 Checking available video encoders..."
if command -v ffmpeg >/dev/null 2>&1; then
    echo "   Software encoding: ✅ Available (ffmpeg)"
    
    # Check for hardware encoders
    if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "nvenc"; then
        echo "   NVIDIA NVENC: ✅ Available"
    else
        echo "   NVIDIA NVENC: ❌ Not available"
    fi
    
    if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "vaapi"; then
        echo "   VAAPI: ✅ Available"
    else
        echo "   VAAPI: ❌ Not available"
    fi
else
    echo "   ⚠️  ffmpeg not found - software encoding may not work"
fi

# Check DRI devices for hardware acceleration
echo "🖥️  Checking DRI devices:"
if [ -d "/dev/dri" ]; then
    ls -la /dev/dri/ | sed 's/^/   /'
else
    echo "   ⚠️  /dev/dri not found - hardware acceleration unavailable"
fi

# Set additional environment variables for Sunshine
export SUNSHINE_CONFIG_FILE="$SUNSHINE_CONFIG_FILE"

# Show network information
echo "🌐 Network Information:"
echo "   Container IP: $(hostname -I | awk '{print $1}')"
echo "   Sunshine Web UI: http://$(hostname -I | awk '{print $1}'):$((${SUNSHINE_BASE_PORT:-47984} + 6))"
echo "   Default credentials: user / sunshine"

# Start Sunshine
echo "🚀 Starting Sunshine server..."
echo "   Config: $SUNSHINE_CONFIG_FILE"
echo "   Logs: /home/user/.config/sunshine/sunshine.log"
echo ""
echo "📱 Connect with Moonlight client to: $(hostname -I | awk '{print $1}')"
echo "   Use PIN from web UI for first-time setup"
echo ""

# Find and run Sunshine as user
SUNSHINE_BIN=""
if command -v sunshine >/dev/null 2>&1; then
    SUNSHINE_BIN="sunshine"
elif [ -f "/usr/bin/sunshine" ]; then
    SUNSHINE_BIN="/usr/bin/sunshine"
elif [ -f "/usr/local/bin/sunshine" ]; then
    SUNSHINE_BIN="/usr/local/bin/sunshine"
else
    # Try to find sunshine binary
    SUNSHINE_BIN=$(find /usr -name "sunshine" -type f -executable 2>/dev/null | head -1)
fi

if [ -z "$SUNSHINE_BIN" ]; then
    echo "❌ Sunshine binary not found!"
    echo ""
    echo "🔧 Troubleshooting Options:"
    echo "   1. Run manual installation script:"
    echo "      sudo /usr/local/bin/install-sunshine-manual"
    echo ""
    echo "   2. Try package manager installation:"
    echo "      sudo apt update && sudo apt install sunshine"
    echo ""
    echo "   3. Download manually from:"
    echo "      https://github.com/LizardByte/Sunshine/releases"
    echo ""
    echo "   4. Check if Sunshine is installed elsewhere:"
    echo "      find /usr -name 'sunshine' -type f 2>/dev/null"
    echo ""
    echo "💡 After installation, try running this script again."
    exit 1
fi

echo "🚀 Using Sunshine binary: $SUNSHINE_BIN"

# Final pre-flight checks
echo "🔧 Final configuration checks..."
echo "   Display: $DISPLAY"
echo "   Config: $SUNSHINE_CONFIG_FILE"
echo "   User: $(whoami) -> user"

# Ensure config file is owned by user
chown user:user "$SUNSHINE_CONFIG_FILE" 2>/dev/null || true

echo ""
echo "🌞 Starting Sunshine Game Streaming Server..."
echo "   If you see 'Unable to find display or encoder' errors:"
echo "   1. Check that X11 is running: xdpyinfo -display :1"
echo "   2. Try software encoding first (already configured)"
echo "   3. Check logs at: /home/user/.config/sunshine/sunshine.log"
echo "   4. Web UI will be at: http://$(hostname -I | awk '{print $1}'):$((${SUNSHINE_BASE_PORT:-47984} + 6))"
echo ""

# Run Sunshine as user with proper environment
exec sudo -u user \
    DISPLAY=:1 \
    XDG_RUNTIME_DIR=/tmp/runtime-user \
    PULSE_SERVER="unix:/tmp/pulse-native" \
    "$SUNSHINE_BIN" "$SUNSHINE_CONFIG_FILE" 