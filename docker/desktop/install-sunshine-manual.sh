#!/bin/bash

# Manual Sunshine Installation Script
# Run this inside the container if Sunshine is not working

echo "🌞 Manual Sunshine Installation Script"
echo "======================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (or with sudo)"
    exit 1
fi

# Update package lists
echo "📦 Updating package lists..."
apt-get update

# Install dependencies if not already installed
echo "📦 Installing dependencies..."
apt-get install -y \
    wget \
    curl \
    ca-certificates \
    gnupg \
    lsb-release

# Method 1: Try official GitHub releases
echo "🔄 Method 1: Trying GitHub releases..."
cd /tmp

# Get latest version
SUNSHINE_VERSION=$(curl -s https://api.github.com/repos/LizardByte/Sunshine/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')

if [ -n "$SUNSHINE_VERSION" ]; then
    echo "📥 Downloading Sunshine $SUNSHINE_VERSION..."
    
    # Try different package names
    for PKG_NAME in "sunshine-ubuntu-22.04-amd64.deb" "sunshine-linux-amd64.deb" "sunshine_${SUNSHINE_VERSION}_amd64.deb"; do
        echo "   Trying: $PKG_NAME"
        if wget -q "https://github.com/LizardByte/Sunshine/releases/download/${SUNSHINE_VERSION}/${PKG_NAME}" -O sunshine.deb; then
            echo "✅ Downloaded: $PKG_NAME"
            break
        else
            echo "❌ Failed: $PKG_NAME"
        fi
    done
    
    if [ -f sunshine.deb ]; then
        echo "📦 Installing Sunshine package..."
        if dpkg -i sunshine.deb; then
            echo "✅ Sunshine installed successfully!"
            rm sunshine.deb
            
            # Verify installation
            if command -v sunshine >/dev/null 2>&1; then
                echo "✅ Sunshine binary found in PATH"
                sunshine --version 2>/dev/null || echo "Sunshine installed but version check failed"
            else
                echo "⚠️  Sunshine installed but not in PATH, creating symlink..."
                find /usr -name "sunshine" -type f -executable 2>/dev/null | head -1 | xargs -I {} ln -sf {} /usr/bin/sunshine
            fi
            
            exit 0
        else
            echo "❌ Package installation failed, trying to fix dependencies..."
            apt-get install -f -y
            if dpkg -i sunshine.deb; then
                echo "✅ Sunshine installed after fixing dependencies!"
                rm sunshine.deb
                exit 0
            else
                echo "❌ Package installation still failed"
                rm sunshine.deb
            fi
        fi
    fi
fi

# Method 2: Try AppImage
echo "🔄 Method 2: Trying AppImage..."
APPIMAGE_URL="https://github.com/LizardByte/Sunshine/releases/download/${SUNSHINE_VERSION}/sunshine.AppImage"
if wget -q "$APPIMAGE_URL" -O sunshine.AppImage; then
    chmod +x sunshine.AppImage
    mv sunshine.AppImage /usr/local/bin/sunshine
    echo "✅ Sunshine AppImage installed!"
    exit 0
fi

# Method 3: Create a helper script for manual installation
echo "🔄 Method 3: Creating installation helper..."
cat > /usr/local/bin/sunshine << 'EOF'
#!/bin/bash
echo "🌞 Sunshine Game Streaming Server"
echo "================================="
echo ""
echo "❌ Sunshine is not properly installed on this system."
echo ""
echo "📋 Manual Installation Options:"
echo ""
echo "1. Download from GitHub:"
echo "   https://github.com/LizardByte/Sunshine/releases"
echo ""
echo "2. Install via package manager (if available):"
echo "   sudo apt update"
echo "   sudo apt install sunshine"
echo ""
echo "3. Build from source:"
echo "   git clone https://github.com/LizardByte/Sunshine.git"
echo "   cd Sunshine"
echo "   # Follow build instructions in README"
echo ""
echo "4. Use Docker image:"
echo "   docker run -d --name sunshine lizardbyte/sunshine"
echo ""
echo "📖 For detailed instructions, visit:"
echo "   https://docs.lizardbyte.dev/projects/sunshine/"
echo ""
exit 1
EOF

chmod +x /usr/local/bin/sunshine

echo "⚠️  Automatic installation failed!"
echo "📝 Created helper script at /usr/local/bin/sunshine"
echo "🔧 Run 'sunshine' to see manual installation options"
echo ""
echo "💡 You can also try:"
echo "   - Checking internet connectivity"
echo "   - Running this script again later"
echo "   - Installing manually from https://github.com/LizardByte/Sunshine/releases"

exit 1 