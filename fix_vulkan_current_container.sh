#!/bin/bash

# Quick fix for Vulkan in current container
CONTAINER_ID="40dfff2a4f72"

echo "🔧 Applying Vulkan fix to container $CONTAINER_ID..."

# Set environment variables in the container
docker exec -it $CONTAINER_ID bash -c "
# Add Vulkan environment variables to /etc/environment
echo '# Vulkan Environment Variables for Steam and Games' >> /etc/environment
echo 'VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /etc/environment
echo 'VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d' >> /etc/environment
echo 'VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /etc/environment
echo 'VK_INSTANCE_LAYERS=' >> /etc/environment
echo 'VK_DEVICE_LAYERS=' >> /etc/environment

# Add to user's bashrc
echo 'export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /home/user/.bashrc
echo 'export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d' >> /home/user/.bashrc
echo 'export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json' >> /home/user/.bashrc
echo 'export VK_INSTANCE_LAYERS=' >> /home/user/.bashrc
echo 'export VK_DEVICE_LAYERS=' >> /home/user/.bashrc

# Create Steam Vulkan wrapper
mkdir -p /home/user/.config/steam
cat > /home/user/.config/steam/vulkan_env.sh << 'EOF'
#!/bin/bash
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json
export VK_LAYER_PATH=/usr/share/vulkan/explicit_layer.d
export VK_DRIVER_FILES=/usr/share/vulkan/icd.d/nvidia_icd.json
export VK_INSTANCE_LAYERS=
export VK_DEVICE_LAYERS=
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export LIBGL_ALWAYS_INDIRECT=0
export LIBGL_ALWAYS_SOFTWARE=0
EOF
chmod +x /home/user/.config/steam/vulkan_env.sh
chown -R user:user /home/user/.config/steam

# Update Steam desktop shortcut
cat > /home/user/Desktop/Steam.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Steam (Vulkan Fixed)
Comment=Steam with Vulkan environment variables
Exec=bash -c \"source /home/user/.config/steam/vulkan_env.sh; steam\"
Icon=steam
Terminal=false
Categories=Game;
StartupNotify=true
MimeType=x-scheme-handler/steam;
EOF
chmod +x /home/user/Desktop/Steam.desktop
chown user:user /home/user/Desktop/Steam.desktop

echo '✅ Vulkan fix applied successfully!'
echo 'ℹ️  Please restart Steam or use the new Steam desktop shortcut'
echo 'ℹ️  To test: source /home/user/.config/steam/vulkan_env.sh && vulkaninfo --summary'
"

echo "🎮 Vulkan fix completed! You can now:"
echo "1. Use the updated Steam desktop shortcut"
echo "2. Or run: docker exec -it $CONTAINER_ID bash -c 'source /home/user/.config/steam/vulkan_env.sh && steam'"
echo "3. Test Vulkan: docker exec -it $CONTAINER_ID bash -c 'source /home/user/.config/steam/vulkan_env.sh && vulkaninfo --summary'" 