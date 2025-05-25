# 🎮 Cloud Gaming / Remote Desktop System

Ein vollständiges Cloud-Gaming und Remote-Desktop-System, das es Benutzern ermöglicht, virtuelle Desktop-Container mit VNC-Zugriff auf einem headless Server zu erstellen und zu verwalten.

## 🌟 Features

### 🖥️ Container-Management
- **Ein Container pro Benutzer**: Jeder Benutzer kann einen persönlichen Desktop-Container erstellen
- **VNC-Zugriff**: Port-Bereich 11000-11430 für VNC-Server
- **Web-VNC**: Browser-basierter Zugriff über noVNC (Port-Bereich 12000-12430)
- **Ubuntu 22.04 + XFCE4**: Vollständige Desktop-Umgebung
- **Automatische Port-Zuweisung**: Keine Konflikte zwischen Containern
- **Skalierbarkeit**: Unterstützt bis zu 430 gleichzeitige Container

### 👥 Benutzerverwaltung
- **Admin-System**: Erster Benutzer wird automatisch Administrator
- **JWT-Authentifizierung**: Sichere Token-basierte Anmeldung
- **Rollenverwaltung**: Admin- und Standard-Benutzer-Rollen

### 🛠️ Technische Features
- **Docker-Integration**: Vollständige Container-Verwaltung über Docker API
- **SQLite-Datenbank**: Leichtgewichtige Datenspeicherung
- **React-Frontend**: Moderne Web-Oberfläche mit Material-UI
- **Node.js-Backend**: RESTful API mit Express.js

## 🏗️ Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Desktop        │
│   (React)       │◄──►│   (Node.js)     │◄──►│  Containers     │
│   Port: 3003    │    │   Port: 3002    │    │ Ports: 11000-   │
└─────────────────┘    └─────────────────┘    │      11430      │
                              │               └─────────────────┘
                              ▼
                       ┌─────────────────┐
                       │   SQLite DB     │
                       │   + Docker API  │
                       └─────────────────┘
```

## 🚀 Schnellstart

### Voraussetzungen
- Docker & Docker Compose
- Git
- Mindestens 4GB RAM
- Linux/macOS/Windows mit WSL2

### 1. Repository klonen
```bash
git clone <repository-url>
cd cloud-gaming
```

### 2. Desktop-Image bauen
```bash
# Linux/macOS
chmod +x build-desktop-image.sh
./build-desktop-image.sh

# Windows PowerShell
.\build-desktop-image.ps1
```

### 3. System starten
```bash
# Alle Services starten
docker-compose up -d

# Logs verfolgen
docker-compose logs -f
```

### 4. Zugriff
- **Web-Interface**: http://localhost:3003
- **API**: http://localhost:3002

## 📋 Erste Schritte

### 1. Administrator-Account erstellen
1. Öffnen Sie http://localhost:3003
2. Klicken Sie auf "Registrieren"
3. Der erste Benutzer wird automatisch Administrator

### 2. Desktop-Container erstellen
1. Melden Sie sich an
2. Navigieren Sie zu "Mein Container"
3. Klicken Sie "Container erstellen"
4. Geben Sie einen Namen ein

### 3. Desktop verwenden
1. Starten Sie den Container
2. Klicken Sie "Desktop öffnen" für Web-VNC
3. Oder verwenden Sie einen VNC-Client mit dem angezeigten Port

## 🖥️ Desktop-Umgebung

Jeder Container enthält:
- **Ubuntu 22.04** Basis-System
- **XFCE4** Desktop-Umgebung
- **Firefox** Web-Browser
- **LibreOffice** Office-Suite
- **Entwicklungstools**: Git, Nano, Vim, htop
- **VNC-Server**: TightVNC für Remote-Zugriff
- **noVNC**: Web-basierter VNC-Client

## 🔧 Konfiguration

### Port-Bereiche
- **Frontend**: 3003
- **Backend**: 3002
- **VNC-Server**: 11000-11430
- **Web-VNC**: 12000-12430

### Umgebungsvariablen
```bash
# Backend (.env)
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
DB_PATH=/app/data/database.sqlite

# Container
VNC_PASSWORD=cloudgaming
DISPLAY=:1
```

## 🛠️ Entwicklung

### Backend starten
```bash
cd backend
npm install
npm run dev
```

### Frontend starten
```bash
cd frontend
npm install
npm run dev
```

### Desktop-Image entwickeln
```bash
cd docker/desktop
docker build -t cloud-gaming-desktop:dev .
```

## 📊 API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Anmelden
- `POST /api/auth/logout` - Abmelden

### Container-Management
- `GET /api/containers` - Container abrufen
- `POST /api/containers/create` - Container erstellen
- `POST /api/containers/start` - Container starten
- `POST /api/containers/stop` - Container stoppen
- `DELETE /api/containers` - Container löschen

### Administration (Admin only)
- `GET /api/admin/users` - Alle Benutzer
- `GET /api/containers/logs` - Container-Logs

## 🔒 Sicherheit

- **JWT-Token**: Sichere Authentifizierung
- **Passwort-Hashing**: bcrypt für Passwort-Sicherheit
- **Container-Isolation**: Jeder Benutzer hat eigenen Container
- **Port-Isolation**: Automatische Port-Zuweisung verhindert Konflikte
- **Admin-Rechte**: Erste Benutzer wird automatisch Administrator

## 🐛 Fehlerbehebung

### Container startet nicht
```bash
# Logs prüfen
docker-compose logs backend

# Desktop-Image neu bauen
./build-desktop-image.sh
```

### VNC-Verbindung fehlgeschlagen
```bash
# Container-Status prüfen
docker ps

# Port-Verfügbarkeit prüfen
netstat -ln | grep 11000
```

### Datenbank-Probleme
```bash
# Datenbank zurücksetzen
rm -rf data/database.sqlite
docker-compose restart backend
```

## 📁 Projektstruktur

```
cloud-gaming/
├── backend/                 # Node.js API Server
│   ├── routes/             # API-Routen
│   ├── middleware/         # Auth & Validation
│   ├── database/           # SQLite Setup
│   └── utils/              # Hilfsfunktionen
├── frontend/               # React Web-App
│   ├── src/
│   │   ├── pages/          # Seiten-Komponenten
│   │   ├── components/     # UI-Komponenten
│   │   ├── contexts/       # React Contexts
│   │   └── services/       # API-Services
├── docker/
│   └── desktop/            # Desktop-Container
│       ├── Dockerfile      # Ubuntu + XFCE4
│       └── start-desktop.sh # Startup-Script
├── data/                   # Persistente Daten
└── docker-compose.yml     # Service-Orchestrierung
```

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch
3. Committen Sie Ihre Änderungen
4. Erstellen Sie eine Pull Request

## 📄 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🆘 Support

Bei Problemen oder Fragen:
1. Prüfen Sie die Logs: `docker-compose logs`
2. Überprüfen Sie die Dokumentation
3. Erstellen Sie ein Issue im Repository

---

**Hinweis**: Dieses System ist für Entwicklungs- und Testzwecke konzipiert. Für Produktionsumgebungen sollten zusätzliche Sicherheitsmaßnahmen implementiert werden. 