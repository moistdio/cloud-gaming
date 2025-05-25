# Cloud Gaming / Remote Desktop System

Ein System, das es Benutzern ermöglicht, eigene Docker-Container mit VNC-Zugang zu virtuellen Desktops zu erstellen und zu verwalten.

## 🚀 Schnellstart

### Windows
```powershell
.\setup.ps1
```

### Linux/Mac
```bash
./setup.sh
```

Das war's! Das Script richtet alles automatisch ein.

## Features

- 🖥️ Individuelle Docker-Container pro Benutzer
- 🔒 Benutzerauthentifizierung und Session-Management
- 🖱️ VNC-Zugang zu virtuellen Desktops
- 🌐 Web-basierte Benutzeroberfläche
- 📊 Container-Status und -Verwaltung
- 🔧 Automatische Container-Bereitstellung

## Architektur

- **Frontend**: React.js mit modernem UI
- **Backend**: Node.js/Express API
- **Container**: Ubuntu Desktop mit VNC-Server
- **Database**: SQLite für Benutzerdaten
- **Proxy**: nginx für VNC-Weiterleitung

## Zugriff

Nach dem Setup:
- **Web-Interface**: http://localhost:3000
- **Backend-API**: http://localhost:3001

## Erste Schritte

1. Öffne http://localhost:3000
2. Registriere einen Account (Login-Seite → "Jetzt registrieren")
3. Erstelle einen Container im Dashboard
4. Verbinde dich via VNC oder Web-VNC

## VNC-Zugriff

Jeder Container erhält:
- **VNC-Port**: 5901+ (für VNC-Clients)
- **Web-VNC**: 6081+ (direkt im Browser)

### VNC-Clients
- **Windows**: TightVNC, RealVNC
- **Mac**: Screen Sharing, RealVNC  
- **Linux**: Remmina, TigerVNC

## Verwaltung

```bash
# Logs anzeigen
docker-compose logs -f

# System stoppen
docker-compose down

# System neustarten
docker-compose restart

# Container-Status prüfen
docker ps
```

## Troubleshooting

### System startet nicht
```bash
# Prüfe Docker
docker --version

# Prüfe Logs
docker-compose logs

# Ports prüfen
netstat -an | findstr "3000 3001"
```

### Container-Probleme
```bash
# Desktop Image neu bauen
docker build -t cloud-gaming-desktop:latest docker/desktop/

# Alle Container stoppen
docker stop $(docker ps -q)
```

## Erweiterte Konfiguration

Siehe `SETUP.md` für:
- Detaillierte Installationsanweisungen
- Sicherheitskonfiguration
- Entwicklungsumgebung
- Backup-Strategien
- Skalierung

## Ports

- 3000: Web-Interface
- 3001: Backend-API
- 5900+: VNC-Server (dynamisch)
- 6080+: Web-VNC (dynamisch)

## Systemanforderungen

- Docker & Docker Compose
- 4GB+ RAM verfügbar
- Windows 10/11, macOS, oder Linux 