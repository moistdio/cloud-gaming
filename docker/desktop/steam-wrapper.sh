#!/bin/bash

# Steam Wrapper Script for Cloud Gaming
# Automatically handles user namespace and sandbox compatibility

# Check if user namespaces are available
if [ -r /proc/sys/kernel/unprivileged_userns_clone ] && [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null)" = "1" ]; then
    echo "✅ User namespaces available, running Steam normally"
    exec /usr/games/steam "$@"
else
    echo "⚠️ User namespaces not available, running Steam with sandbox disabled"
    exec /usr/games/steam --no-sandbox --disable-seccomp-filter-sandbox "$@"
fi 