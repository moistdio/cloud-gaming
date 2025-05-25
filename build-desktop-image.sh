#!/bin/bash

echo "Building Cloud Gaming Desktop Image..."

# Zum Docker-Verzeichnis wechseln
cd docker/desktop

# Docker Image bauen
docker build -t cloud-gaming-desktop:latest .

if [ $? -eq 0 ]; then
    echo "✅ Desktop Image erfolgreich erstellt!"
    echo "Image: cloud-gaming-desktop:latest"
else
    echo "❌ Fehler beim Erstellen des Desktop Images"
    exit 1
fi

echo "Fertig!" 