#!/bin/bash

# Steam Initialization Script
# Handles first-time Steam setup and steamwebhelper issues

echo "🎮 Initializing Steam for first-time use..."

# Ensure we're running as the user
if [ "$EUID" -eq 0 ]; then
    echo "Running Steam initialization as user..."
    exec sudo -u user -E HOME=/home/user DISPLAY=$DISPLAY "$0" "$@"
fi

# Set up Steam environment
export HOME=/home/user
export STEAM_COMPAT_CLIENT_INSTALL_PATH=/home/user/.steam
export STEAM_RUNTIME=1
export __GLX_VENDOR_LIBRARY_NAME=nvidia
export PULSE_SERVER="unix:/tmp/pulse-native"

# Create Steam directories with proper permissions
mkdir -p ~/.steam
mkdir -p ~/.local/share/Steam
mkdir -p ~/.steam/steam
mkdir -p ~/.steam/root

# Create Steam configuration to skip initial setup
mkdir -p ~/.steam/config
cat > ~/.steam/config/config.vdf << 'EOF'
"InstallConfigStore"
{
    "Software"
    {
        "Valve"
        {
            "Steam"
            {
                "AutoLaunchGameListOnStart"    "0"
                "BigPictureInForeground"       "0"
                "StartupMode"                  "0"
                "SkinV5"                       "1"
                "UsePushToTalk"                "0"
                "VoiceVolume"                  "1.0"
                "MicrophoneVolume"             "1.0"
                "friends"
                {
                    "PersonaStateDesired"      "1"
                    "Notifications_ShowIngame" "1"
                    "Sounds_PlayIngame"        "1"
                    "Notifications_ShowOnline" "1"
                    "Sounds_PlayOnline"        "1"
                    "Notifications_ShowMessage" "1"
                    "Sounds_PlayMessage"       "1"
                    "AutoSignIntoFriends"      "1"
                }
            }
        }
    }
}
EOF

# Create loginusers.vdf to avoid login prompts
cat > ~/.steam/config/loginusers.vdf << 'EOF'
"users"
{
}
EOF

# Fix steamwebhelper by creating a wrapper
mkdir -p ~/.steam/ubuntu12_32/steam-runtime/bin
cat > ~/.steam/ubuntu12_32/steam-runtime/bin/steamwebhelper << 'EOF'
#!/bin/bash
# Steamwebhelper wrapper for container compatibility
exec /home/user/.steam/ubuntu12_32/steamwebhelper --no-sandbox --disable-seccomp-filter-sandbox --disable-gpu-sandbox --in-process-gpu "$@"
EOF
chmod +x ~/.steam/ubuntu12_32/steam-runtime/bin/steamwebhelper

echo "✅ Steam initialization completed"
echo "🚀 You can now run Steam with: steam" 