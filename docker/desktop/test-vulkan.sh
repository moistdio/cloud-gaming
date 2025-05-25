#!/bin/bash

# Vulkan Test Script for Cloud Gaming Container
# Tests Vulkan configuration and provides debugging information

set -e

echo "🔍 Vulkan Configuration Test"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check Vulkan environment variables
echo "📋 Vulkan Environment Variables:"
echo "  VK_ICD_FILENAMES: ${VK_ICD_FILENAMES:-Not set}"
echo "  VK_LAYER_PATH: ${VK_LAYER_PATH:-Not set}"
echo "  VK_DRIVER_FILES: ${VK_DRIVER_FILES:-Not set}"
echo ""

# Check for Vulkan libraries
echo "📚 Vulkan Libraries:"
for lib in libvulkan.so.1 libvulkan_nvidia.so libvulkan_nvidia.so.1; do
    if ldconfig -p | grep -q "$lib"; then
        log_success "$lib found"
    else
        log_warning "$lib not found"
    fi
done
echo ""

# Check ICD files
echo "🔧 Vulkan ICD Files:"
for icd_dir in /usr/share/vulkan/icd.d /etc/vulkan/icd.d; do
    if [ -d "$icd_dir" ]; then
        echo "  Directory: $icd_dir"
        if [ "$(ls -A $icd_dir 2>/dev/null)" ]; then
            for file in "$icd_dir"/*.json; do
                if [ -f "$file" ]; then
                    echo "    • $(basename "$file")"
                    if [ -r "$file" ]; then
                        library_path=$(grep -o '"library_path"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" | cut -d'"' -f4)
                        if [ ! -z "$library_path" ]; then
                            echo "      Library: $library_path"
                        fi
                    fi
                fi
            done
        else
            log_warning "No ICD files found in $icd_dir"
        fi
    else
        log_warning "Directory $icd_dir does not exist"
    fi
done
echo ""

# Check Vulkan tools
echo "🛠️ Vulkan Tools:"
if command -v vulkaninfo &> /dev/null; then
    log_success "vulkaninfo available"
else
    log_error "vulkaninfo not available"
    echo "  Install with: apt-get install vulkan-tools"
fi

if command -v vkcube &> /dev/null; then
    log_success "vkcube available"
else
    log_warning "vkcube not available"
fi
echo ""

# Test Vulkan functionality
if command -v vulkaninfo &> /dev/null; then
    echo "🧪 Vulkan Functionality Test:"
    
    # Set up display for testing
    export DISPLAY=${DISPLAY:-:1}
    
    # Test vulkaninfo
    log_info "Running vulkaninfo..."
    if vulkaninfo --summary 2>/dev/null; then
        log_success "vulkaninfo executed successfully"
        
        # Count devices
        device_count=$(vulkaninfo --summary 2>/dev/null | grep "deviceName" | wc -l)
        if [ "$device_count" -gt 0 ]; then
            log_success "Found $device_count Vulkan device(s):"
            vulkaninfo --summary 2>/dev/null | grep "deviceName" | while read line; do
                echo "    • $line"
            done
        else
            log_warning "No Vulkan devices found"
        fi
        
        # Check for NVIDIA
        if vulkaninfo --summary 2>/dev/null | grep -q "NVIDIA"; then
            log_success "NVIDIA Vulkan driver detected"
        else
            log_info "NVIDIA Vulkan driver not detected (may be using Mesa)"
        fi
        
    else
        log_error "vulkaninfo failed to execute"
        echo "  This indicates a Vulkan configuration problem"
    fi
else
    log_warning "Cannot test Vulkan functionality - vulkaninfo not available"
fi

echo ""
echo "🔧 Troubleshooting Tips:"
echo "  1. Ensure NVIDIA drivers are properly installed"
echo "  2. Check that /dev/nvidia* devices exist and are accessible"
echo "  3. Verify Vulkan ICD files point to correct libraries"
echo "  4. Set VK_ICD_FILENAMES environment variable if needed"
echo "  5. For Steam games, ensure VK_* variables are set in game environment"
echo ""

# Provide fix suggestions
if ! command -v vulkaninfo &> /dev/null; then
    echo "💡 To install Vulkan tools:"
    echo "  apt-get update && apt-get install -y vulkan-tools"
fi

if [ -z "$VK_ICD_FILENAMES" ]; then
    echo "💡 To set Vulkan environment variables:"
    echo "  export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json"
    echo "  export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d"
fi

echo ""
echo "✅ Vulkan test completed!" 