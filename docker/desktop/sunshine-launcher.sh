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
# Optimized for NVIDIA GPU hardware acceleration

# Network Configuration
address_family = both
port = 47989
origin_web_ui_allowed = pc

# Video Configuration
# Use NVIDIA hardware encoding for best performance
encoder = nvenc
adapter_name = /dev/dri/renderD128

# Video quality settings
bitrate = 20000
fps = 60
min_threads = 2

# Audio Configuration
audio_sink = auto

# Input Configuration
key_repeat_delay = 500
key_repeat_frequency = 24

# Security
username = user
password = sunshine

# Advanced GPU settings
nvenc_preset = p1
nvenc_rc = cbr_hq
nvenc_coder = h264

# Display settings
output_name = :1

# Logging
min_log_level = info
log_path = /home/user/.config/sunshine/sunshine.log
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

# Show network information
echo "🌐 Network Information:"
echo "   Container IP: $(hostname -I | awk '{print $1}')"
echo "   Sunshine Web UI: http://$(hostname -I | awk '{print $1}'):47990"
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

# Run Sunshine as user
exec sudo -u user "$SUNSHINE_BIN" "$SUNSHINE_CONFIG_FILE" 