#!/bin/bash

# Sunshine Compatibility Test Script
# Run this to diagnose display and encoder issues

echo "🌞 Sunshine Compatibility Test"
echo "=============================="
echo ""

# Test 1: X11 Display
echo "🖥️  Test 1: X11 Display"
if xdpyinfo -display :1 >/dev/null 2>&1; then
    echo "✅ X11 display :1 is accessible"
    DISPLAY_INFO=$(xdpyinfo -display :1 2>/dev/null | grep -E "dimensions|resolution" | head -2)
    echo "$DISPLAY_INFO" | sed 's/^/   /'
else
    echo "❌ X11 display :1 is NOT accessible"
    echo "   Try: export DISPLAY=:1 && xdpyinfo"
fi
echo ""

# Test 2: Video Encoders
echo "🎥 Test 2: Video Encoders"
if command -v ffmpeg >/dev/null 2>&1; then
    echo "✅ FFmpeg is available"
    
    # Test software encoding
    echo "   Testing software encoding..."
    if ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -c:v libx264 -f null - >/dev/null 2>&1; then
        echo "   ✅ Software encoding (libx264) works"
    else
        echo "   ❌ Software encoding failed"
    fi
    
    # Test hardware encoders
    echo "   Checking hardware encoders..."
    if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "h264_nvenc"; then
        echo "   ✅ NVIDIA NVENC available"
        # Test NVENC
        if ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -c:v h264_nvenc -f null - >/dev/null 2>&1; then
            echo "   ✅ NVENC encoding test passed"
        else
            echo "   ⚠️  NVENC available but test failed"
        fi
    else
        echo "   ❌ NVIDIA NVENC not available"
    fi
    
    if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "h264_vaapi"; then
        echo "   ✅ VAAPI available"
    else
        echo "   ❌ VAAPI not available"
    fi
else
    echo "❌ FFmpeg is NOT available"
    echo "   Install with: apt-get install ffmpeg"
fi
echo ""

# Test 3: GPU Devices
echo "🎮 Test 3: GPU Devices"
if [ -d "/dev/dri" ]; then
    echo "✅ DRI devices found:"
    ls -la /dev/dri/ | sed 's/^/   /'
else
    echo "❌ No DRI devices found"
    echo "   Hardware acceleration unavailable"
fi

if [ -e "/dev/nvidia0" ]; then
    echo "✅ NVIDIA device found: /dev/nvidia0"
else
    echo "❌ NVIDIA device not found"
fi
echo ""

# Test 4: Audio
echo "🔊 Test 4: Audio System"
if command -v pulseaudio >/dev/null 2>&1; then
    echo "✅ PulseAudio is available"
    if pgrep -x "pulseaudio" > /dev/null; then
        echo "✅ PulseAudio is running"
    else
        echo "⚠️  PulseAudio is not running"
        echo "   Start with: pulseaudio --start"
    fi
else
    echo "❌ PulseAudio not available"
fi
echo ""

# Test 5: Sunshine Binary
echo "🌞 Test 5: Sunshine Installation"
if command -v sunshine >/dev/null 2>&1; then
    echo "✅ Sunshine binary found in PATH"
    SUNSHINE_PATH=$(which sunshine)
    echo "   Location: $SUNSHINE_PATH"
    
    # Try to get version
    if sunshine --version >/dev/null 2>&1; then
        SUNSHINE_VERSION=$(sunshine --version 2>/dev/null | head -1)
        echo "   Version: $SUNSHINE_VERSION"
    else
        echo "   ⚠️  Version check failed"
    fi
else
    echo "❌ Sunshine binary not found"
    echo "   Try: /usr/local/bin/install-sunshine-manual"
fi
echo ""

# Test 6: Configuration
echo "📝 Test 6: Configuration"
CONFIG_FILE="/home/user/.config/sunshine/sunshine.conf"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Sunshine config exists: $CONFIG_FILE"
    echo "   Key settings:"
    grep -E "^(encoder|output_name|capture|x11_display)" "$CONFIG_FILE" 2>/dev/null | sed 's/^/   /' || echo "   ⚠️  Could not read config"
else
    echo "❌ Sunshine config not found"
    echo "   Will be created on first run"
fi
echo ""

# Test 7: Network
echo "🌐 Test 7: Network"
CONTAINER_IP=$(hostname -I | awk '{print $1}')
echo "✅ Container IP: $CONTAINER_IP"
echo "   Sunshine Web UI: http://$CONTAINER_IP:47990"
echo "   Moonlight connection: $CONTAINER_IP"
echo ""

# Summary
echo "📋 Summary & Recommendations"
echo "============================"

# Check for common issues
ISSUES=0

if ! xdpyinfo -display :1 >/dev/null 2>&1; then
    echo "❌ X11 display issue - ensure desktop is running"
    ISSUES=$((ISSUES + 1))
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "❌ FFmpeg missing - install with: apt-get install ffmpeg"
    ISSUES=$((ISSUES + 1))
fi

if ! command -v sunshine >/dev/null 2>&1; then
    echo "❌ Sunshine not installed - run: /usr/local/bin/install-sunshine-manual"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ All basic requirements met!"
    echo "   If Sunshine still fails:"
    echo "   1. Check logs: tail -f /home/user/.config/sunshine/sunshine.log"
    echo "   2. Try software encoding first (default config)"
    echo "   3. Access web UI: http://$CONTAINER_IP:47990"
    echo "   4. Use PIN from web UI to pair Moonlight"
else
    echo "⚠️  Found $ISSUES issue(s) that need attention"
fi

echo ""
echo "🔧 Quick fixes:"
echo "   Start desktop: /usr/local/bin/start-desktop.sh"
echo "   Install Sunshine: /usr/local/bin/install-sunshine-manual"
echo "   Launch Sunshine: /usr/local/bin/sunshine-launcher" 