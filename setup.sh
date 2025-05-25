#!/bin/bash

echo "🚀 Cloud Gaming System Setup"
echo "================================"

# Farben definieren
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Prüfen ob Docker läuft
echo -e "${YELLOW}Prüfe Docker...${NC}"
if command -v docker &> /dev/null; then
    if docker --version &> /dev/null; then
        echo -e "${GREEN}✅ Docker gefunden${NC}"
    else
        echo -e "${RED}❌ Docker läuft nicht${NC}"
        echo -e "${YELLOW}Bitte starte Docker und versuche es erneut${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Docker nicht installiert${NC}"
    echo -e "${YELLOW}Bitte installiere Docker: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

# Prüfen ob Docker Compose verfügbar ist
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose gefunden${NC}"
elif docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose (Plugin) gefunden${NC}"
    # Alias für docker-compose erstellen
    alias docker-compose='docker compose'
else
    echo -e "${RED}❌ Docker Compose nicht gefunden${NC}"
    exit 1
fi

# Backend package-lock.json erstellen falls nicht vorhanden
if [ ! -f "backend/package-lock.json" ]; then
    echo -e "${YELLOW}Erstelle Backend package-lock.json...${NC}"
    cd backend
    npm install --package-lock-only
    cd ..
    echo -e "${GREEN}✅ Backend package-lock.json erstellt${NC}"
fi

# Frontend package-lock.json erstellen falls nicht vorhanden
if [ ! -f "frontend/package-lock.json" ]; then
    echo -e "${YELLOW}Erstelle Frontend package-lock.json...${NC}"
    cd frontend
    npm install --package-lock-only
    cd ..
    echo -e "${GREEN}✅ Frontend package-lock.json erstellt${NC}"
fi

# Desktop Image bauen
echo -e "${YELLOW}Baue Desktop Image...${NC}"
cd docker/desktop
docker build -t cloud-gaming-desktop:latest .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Desktop Image Build fehlgeschlagen${NC}"
    exit 1
fi
cd ../..
echo -e "${GREEN}✅ Desktop Image erstellt${NC}"

# System starten
echo -e "${YELLOW}Starte Cloud Gaming System...${NC}"
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Cloud Gaming System erfolgreich gestartet!${NC}"
    echo ""
    echo -e "${CYAN}Zugriff:${NC}"
    echo -e "${WHITE}  Web-Interface: http://localhost:3000${NC}"
    echo -e "${WHITE}  Backend-API:   http://localhost:3001${NC}"
    echo ""
    echo -e "${CYAN}Erste Schritte:${NC}"
    echo -e "${WHITE}  1. Öffne http://localhost:3000${NC}"
    echo -e "${WHITE}  2. Registriere einen Account${NC}"
    echo -e "${WHITE}  3. Erstelle einen Container${NC}"
    echo -e "${WHITE}  4. Verbinde dich via VNC${NC}"
    echo ""
    echo -e "${YELLOW}Logs anzeigen: docker-compose logs -f${NC}"
    echo -e "${YELLOW}System stoppen: docker-compose down${NC}"
else
    echo -e "${RED}❌ Fehler beim Starten des Systems${NC}"
    echo -e "${YELLOW}Logs prüfen: docker-compose logs${NC}"
fi 