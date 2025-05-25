# Cloud Gaming System - Setup Anleitung

## Überblick

Dieses System ermöglicht es Benutzern, eigene Docker-Container mit VNC-Zugang zu virtuellen Ubuntu-Desktops zu erstellen und zu verwalten. Perfekt für headless Server!

## Voraussetzungen

- Docker und Docker Compose installiert
- Mindestens 4GB RAM verfügbar
- Ports 3000, 3001, 5900-5950, 6080-6130 verfügbar

## Installation

### 1. Desktop-Image erstellen

Zuerst muss das Ubuntu Desktop Docker-Image erstellt werden:

**Windows:**
```powershell
.\build-desktop-image.ps1
```

**Linux/Mac:**
```bash
./build-desktop-image.sh
```

### 2. System starten

```bash
docker-compose up -d
```

### 3. Zugriff

- **Web-Interface**: http://localhost:3000
- **Backend-API**: http://localhost:3001
- **VNC-Proxy**: http://localhost:8080

## Erste Schritte

### 1. Benutzer registrieren

1. Öffne http://localhost:3000
2. Klicke auf "Jetzt registrieren"
3. Erstelle einen Account

### 2. Container erstellen

1. Melde dich an
2. Gehe zum Dashboard
3. Klicke auf "Container erstellen"
4. Warte bis der Container bereit ist

### 3. Desktop zugreifen

Nach der Container-Erstellung erhältst du:
- **VNC-URL**: `vnc://localhost:5901` (oder höher)
- **Web-VNC**: `http://localhost:6081` (oder höher)

## VNC-Zugriff

### Option 1: Web-Browser
- Öffne die Web-VNC-URL direkt im Browser
- Kein zusätzlicher Client erforderlich

### Option 2: VNC-Client
Empfohlene VNC-Clients:
- **Windows**: TightVNC, RealVNC
- **Mac**: Screen Sharing, RealVNC
- **Linux**: Remmina, TigerVNC

## Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Desktop        │
│   (React)       │◄──►│   (Node.js)     │◄──►│  Container      │
│   Port: 3000    │    │   Port: 3001    │    │  VNC: 5901+     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Database     │
                    │    (SQLite)     │
                    └─────────────────┘
```

## Komponenten

### Backend (Node.js/Express)
- **Authentifizierung**: JWT-basiert
- **Container-Management**: Docker API
- **Datenbank**: SQLite
- **Logging**: Winston

### Frontend (React)
- **UI-Framework**: Material-UI
- **State Management**: React Query
- **Routing**: React Router
- **Build-Tool**: Vite

### Desktop-Container (Ubuntu)
- **Desktop**: XFCE4
- **VNC-Server**: TightVNC
- **Web-VNC**: noVNC + websockify
- **Browser**: Firefox
- **Office**: LibreOffice

## Konfiguration

### Umgebungsvariablen

Erstelle eine `.env` Datei im Hauptverzeichnis:

```env
# Backend
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
DB_PATH=/app/data/database.sqlite
CORS_ORIGIN=http://localhost:3000

# Container-Limits
MAX_CONTAINERS_PER_USER=3
VNC_PORT_START=5900
WEB_VNC_PORT_START=6080

# Logging
LOG_LEVEL=info
```

### Port-Konfiguration

Das System verwendet dynamische Port-Zuweisung:
- **VNC-Ports**: 5900-5950 (50 Container möglich)
- **Web-VNC-Ports**: 6080-6130 (50 Container möglich)

## Sicherheit

### Authentifizierung
- JWT-Token mit 24h Gültigkeit
- Sichere Session-Verwaltung
- Passwort-Hashing mit bcrypt

### Container-Isolation
- Jeder Benutzer hat eigene Container
- Ressourcen-Limits (2GB RAM, CPU-Shares)
- Netzwerk-Isolation

### VNC-Sicherheit
- Zufällige VNC-Passwörter
- Port-basierte Isolation
- Nur lokaler Zugriff standardmäßig

## Troubleshooting

### Container startet nicht
```bash
# Logs prüfen
docker-compose logs backend

# Container-Status prüfen
docker ps -a
```

### VNC-Verbindung fehlschlägt
```bash
# Port-Verfügbarkeit prüfen
netstat -an | grep 590

# Container-Logs prüfen
docker logs <container-id>
```

### Frontend lädt nicht
```bash
# Frontend-Logs prüfen
docker-compose logs frontend

# Backend-Erreichbarkeit testen
curl http://localhost:3001/health
```

## Entwicklung

### Backend entwickeln
```bash
cd backend
npm install
npm run dev
```

### Frontend entwickeln
```bash
cd frontend
npm install
npm run dev
```

### Desktop-Image anpassen
```bash
# Image neu bauen nach Änderungen
docker build -t cloud-gaming-desktop:latest docker/desktop/
```

## Monitoring

### Logs einsehen
```bash
# Alle Services
docker-compose logs -f

# Nur Backend
docker-compose logs -f backend

# Nur Frontend
docker-compose logs -f frontend
```

### Ressourcen-Überwachung
```bash
# Container-Ressourcen
docker stats

# System-Ressourcen
htop
```

## Backup

### Datenbank sichern
```bash
# SQLite-Datei kopieren
cp ./data/database.sqlite ./backup/database-$(date +%Y%m%d).sqlite
```

### Container-Daten sichern
```bash
# Volume-Backup
docker run --rm -v cloud-gaming_user-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/user-data-$(date +%Y%m%d).tar.gz -C /data .
```

## Skalierung

### Horizontale Skalierung
- Load Balancer vor Frontend
- Mehrere Backend-Instanzen
- Shared Database (PostgreSQL)

### Vertikale Skalierung
- Mehr RAM für Container
- Mehr CPU-Cores
- SSD-Storage für bessere Performance

## Support

Bei Problemen:
1. Logs prüfen (`docker-compose logs`)
2. Container-Status prüfen (`docker ps`)
3. Port-Konflikte prüfen (`netstat -an`)
4. Ressourcen prüfen (`docker stats`)

## Lizenz

MIT License - Siehe LICENSE-Datei für Details. 