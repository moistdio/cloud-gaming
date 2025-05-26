#!/bin/bash

# Steam Wrapper Script for Cloud Gaming
# Handles container-specific Steam issues

echo "🎮 Starting Steam with container optimizations..."

# Set Steam environment variables for container compatibility
export STEAM_COMPAT_MOUNTS=/tmp
export STEAM_COMPAT_CLIENT_INSTALL_PATH=/home/user/.steam
export STEAM_RUNTIME_PREFER_HOST_LIBRARIES=0
export STEAM_RUNTIME=1

# GPU acceleration environment
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export __GL_SHADER_DISK_CACHE=1
export __GL_THREADED_OPTIMIZATIONS=1

# CRITICAL: Vulkan environment variables (GitHub issue #393003 fix)
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json
export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d:/usr/share/vulkan/implicit_layer.d
export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json
export VK_INSTANCE_LAYERS=""
export VK_DEVICE_LAYERS=""
export VK_LOADER_DEBUG=error
export VK_LOADER_LAYERS_ENABLE=""

# Audio environment
export PULSE_SERVER="unix:/tmp/pulse-native"

# Create Steam directories
mkdir -p /home/user/.steam
mkdir -p /home/user/.local/share/Steam
chown -R user:user /home/user/.steam
chown -R user:user /home/user/.local/share/Steam

# Steam container-specific flags
STEAM_FLAGS=(
    --no-cef-sandbox
    --disable-seccomp-filter-sandbox
    --disable-gpu-sandbox
    --no-sandbox
    --in-process-gpu
    --disable-dev-shm-usage
    --disable-software-rasterizer
    --enable-features=VaapiVideoDecoder
    --use-gl=desktop
)

# Check if user namespaces are available
if [ -r /proc/sys/kernel/unprivileged_userns_clone ] && [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)" = "1" ]; then
    echo "✅ User namespaces available"
    # Remove some sandbox flags if user namespaces work
    STEAM_FLAGS=(${STEAM_FLAGS[@]/--no-sandbox})
    STEAM_FLAGS=(${STEAM_FLAGS[@]/--disable-seccomp-filter-sandbox})
else
    echo "⚠️ User namespaces not available, using full sandbox bypass"
fi

echo "🚀 Launching Steam with flags: ${STEAM_FLAGS[*]}"

# Run Steam as user with all optimizations
exec sudo -u user -E HOME=/home/user DISPLAY=$DISPLAY /usr/games/steam "${STEAM_FLAGS[@]}" "$@" 