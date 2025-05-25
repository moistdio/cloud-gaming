#!/bin/bash

# Cloud Gaming Desktop Image Build Script
# Baut das Docker-Image für die virtuellen Desktop-Container

set -e

echo "🏗️ Building Cloud Gaming Desktop Image..."

# Zum Docker-Verzeichnis wechseln
cd docker/desktop

# Docker-Image bauen
echo "📦 Building Docker image..."
docker build -t cloud-gaming-desktop:latest .

# Prüfen ob Build erfolgreich war
if [ $? -eq 0 ]; then
    echo "✅ Desktop image successfully built!"
    echo ""
    echo "📋 Image Information:"
    docker images cloud-gaming-desktop:latest
    echo ""
    echo "🚀 You can now start the system with:"
    echo "   docker-compose up -d"
else
    echo "❌ Failed to build desktop image"
    exit 1
fi

echo "Fertig!" 