#!/bin/bash

# Sunshine Safe Startup Script
# Handles segmentation faults and provides fallback configurations

echo "🌞 Sunshine Safe Startup - Containerized Game Streaming"

# Set up environment variables
export DISPLAY=:1
export PULSE_RUNTIME_PATH=/tmp/pulse-runtime
export XDG_RUNTIME_DIR=/tmp/runtime-user

# Create runtime directories
mkdir -p $XDG_RUNTIME_DIR 2>/dev/null || true
chmod 700 $XDG_RUNTIME_DIR 2>/dev/null || true
mkdir -p $PULSE_RUNTIME_PATH 2>/dev/null || true

# Configuration directory
SUNSHINE_CONFIG_DIR="/home/user/.config/sunshine"
SUNSHINE_CONFIG_FILE="$SUNSHINE_CONFIG_DIR/sunshine.conf"

# Ensure config directory exists
mkdir -p "$SUNSHINE_CONFIG_DIR"

# Function to create safe configuration
create_safe_config() {
    local config_type="$1"
    echo "📝 Creating $config_type Sunshine configuration..."
    
    case "$config_type" in
        "minimal")
            cat > "$SUNSHINE_CONFIG_FILE" << EOF
# Minimal Sunshine Configuration - Maximum Compatibility
address_family = both
port = \${SUNSHINE_BASE_PORT:-47984}
origin_web_ui_allowed = pc

# Display
output_name = :1.0
capture = x11

# Force software encoding only
encoder = software
force_software_encoding = true
nvenc = disabled
vaapi = disabled
qsv = disabled

# Basic video settings
bitrate = 8000
fps = 30
sw_preset = ultrafast

# Disable problematic features
gamepad = disabled
mouse = disabled
keyboard = disabled
upnp = disabled
lan_encryption = disabled

# Audio
audio_sink = pulse

# Security
username = user
password = sunshine

# Logging
min_log_level = warning
log_path = /home/user/.config/sunshine/sunshine.log
EOF
            ;;
        "standard")
            cat > "$SUNSHINE_CONFIG_FILE" << EOF
# Standard Sunshine Configuration - Software Encoding
address_family = both
port = \${SUNSHINE_BASE_PORT:-47984}
origin_web_ui_allowed = pc

# Display
output_name = :1.0
capture = x11

# Software encoding with optimizations
encoder = software
force_software_encoding = true
sw_preset = fast
sw_tune = zerolatency
nvenc = disabled
vaapi = disabled
qsv = disabled

# Video settings
bitrate = 12000
fps = 30
min_threads = 2
crf = 20

# Audio
audio_sink = pulse

# Input (basic support)
key_repeat_delay = 500
key_repeat_frequency = 24
gamepad = disabled

# Security
username = user
password = sunshine

# Logging
min_log_level = info
log_path = /home/user/.config/sunshine/sunshine.log

# Disable problematic features
upnp = disabled
lan_encryption = disabled
EOF
            ;;
    esac
    
    chown user:user "$SUNSHINE_CONFIG_FILE"
}

# Function to test Sunshine startup
test_sunshine_startup() {
    local timeout_duration="$1"
    echo "🧪 Testing Sunshine startup (timeout: ${timeout_duration}s)..."
    
    # Start Sunshine in background with timeout
    timeout "$timeout_duration" sudo -u user \
        DISPLAY=:1 \
        XDG_RUNTIME_DIR=/tmp/runtime-user \
        sunshine "$SUNSHINE_CONFIG_FILE" &
    
    local sunshine_pid=$!
    sleep 3
    
    # Check if process is still running
    if kill -0 "$sunshine_pid" 2>/dev/null; then
        echo "✅ Sunshine started successfully"
        kill "$sunshine_pid" 2>/dev/null
        wait "$sunshine_pid" 2>/dev/null
        return 0
    else
        echo "❌ Sunshine failed to start or crashed"
        return 1
    fi
}

# Function to start Sunshine with monitoring
start_sunshine_monitored() {
    echo "🚀 Starting Sunshine with crash monitoring..."
    
    while true; do
        echo "$(date): Starting Sunshine server..."
        
        # Start Sunshine
        sudo -u user \
            DISPLAY=:1 \
            XDG_RUNTIME_DIR=/tmp/runtime-user \
            PULSE_SERVER="unix:/tmp/pulse-native" \
            sunshine "$SUNSHINE_CONFIG_FILE" &
        
        local sunshine_pid=$!
        echo "Sunshine PID: $sunshine_pid"
        
        # Monitor the process
        wait "$sunshine_pid"
        local exit_code=$?
        
        echo "$(date): Sunshine exited with code $exit_code"
        
        if [ $exit_code -eq 0 ]; then
            echo "Sunshine shut down normally"
            break
        elif [ $exit_code -eq 139 ]; then
            echo "⚠️  Segmentation fault detected, restarting with safer config..."
            create_safe_config "minimal"
            sleep 5
        else
            echo "⚠️  Unexpected exit, restarting in 10 seconds..."
            sleep 10
        fi
    done
}

# Main execution
echo "🔍 Checking prerequisites..."

# Wait for X11
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

# Start PulseAudio if needed
if ! pgrep -x "pulseaudio" > /dev/null; then
    echo "🔊 Starting PulseAudio..."
    pulseaudio --start --log-target=syslog 2>/dev/null || echo "⚠️  PulseAudio start failed"
fi

# Check if Sunshine binary exists
if ! command -v sunshine >/dev/null 2>&1; then
    echo "❌ Sunshine binary not found!"
    exit 1
fi

echo "🌐 Network Information:"
echo "   Container IP: $(hostname -I | awk '{print $1}')"
echo "   Sunshine Base Port: ${SUNSHINE_BASE_PORT:-47984}"
echo "   Sunshine Web UI: http://$(hostname -I | awk '{print $1}'):$((${SUNSHINE_BASE_PORT:-47984} + 6))"
echo "   Default credentials: user / sunshine"
echo ""

# Try different configurations in order of safety
configs=("minimal" "standard")

for config in "${configs[@]}"; do
    echo "🔧 Trying $config configuration..."
    create_safe_config "$config"
    
    if test_sunshine_startup 10; then
        echo "✅ $config configuration works!"
        break
    else
        echo "❌ $config configuration failed"
        if [ "$config" = "minimal" ]; then
            echo "⚠️  Even minimal config failed - there may be a deeper issue"
            echo "📋 Troubleshooting suggestions:"
            echo "   1. Check X11 is working: xdpyinfo -display :1"
            echo "   2. Check logs: tail -f /home/user/.config/sunshine/sunshine.log"
            echo "   3. Try manual start: sudo -u user sunshine /home/user/.config/sunshine/sunshine.conf"
            echo "   4. Check GPU drivers: nvidia-smi"
            exit 1
        fi
    fi
done

echo ""
echo "🌞 Starting Sunshine in production mode..."
echo "   Config: $SUNSHINE_CONFIG_FILE"
echo "   Logs: /home/user/.config/sunshine/sunshine.log"
echo "   Web UI: http://$(hostname -I | awk '{print $1}'):$((${SUNSHINE_BASE_PORT:-47984} + 6))"
echo ""
echo "📱 Connect with Moonlight client to: $(hostname -I | awk '{print $1}')"
echo "   Use PIN from web UI for first-time setup"
echo ""

# Start with monitoring
start_sunshine_monitored 