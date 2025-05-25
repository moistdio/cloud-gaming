# 🎮 Cloud Gaming System

Ein vollständiges Cloud Gaming/Remote Desktop System, das es Benutzern ermöglicht, ihre eigenen Docker-Container mit VNC-Zugriff auf virtuelle Desktops auf einem Headless-Server zu erstellen.

## ✨ Features

- **🔐 Benutzerauthentifizierung**: JWT-basierte Anmeldung mit bcrypt-Passwort-Hashing
- **👑 Admin-System**: Der erste Benutzer wird automatisch Administrator
- **🖥️ Desktop-Container**: Ubuntu 22.04 mit XFCE4-Desktop-Umgebung
- **🌐 VNC-Zugriff**: TightVNC-Server mit noVNC-Web-Interface
- **📱 Responsive UI**: Moderne React-Frontend mit Material-UI
- **🐳 Container-Management**: Vollständige Docker-Integration
- **📊 Monitoring**: Aktivitätslogs und Session-Management
- **🔒 Sicherheit**: Container-Isolation mit Ressourcenlimits

## 🚀 Schnellstart

### Voraussetzungen

- Docker & Docker Compose
- Node.js 18+ (für Entwicklung)
- 4GB+ RAM empfohlen

### 1. Repository klonen

```bash
git clone <repository-url>
cd cloud-gaming
```

### 2. System starten

**Linux/macOS:**
```bash
./start-system.sh
```

**Windows (PowerShell):**
```powershell
.\start-system.ps1
```

**Manuell:**
```bash
# Desktop-Image bauen
cd docker/desktop
docker build -t cloud-gaming-desktop .
cd ../..

# System starten
docker-compose up -d --build
```

### 3. Zugriff

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3002
- **API Health**: http://localhost:3002/api/health

## 👤 Erste Schritte

1. **Registrierung**: Öffnen Sie http://localhost:3003 und registrieren Sie sich
   - Der erste Benutzer wird automatisch **Administrator**
   - Starke Passwörter erforderlich (min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen)

2. **Desktop erstellen**: Nach der Anmeldung können Sie Desktop-Container erstellen

3. **VNC-Zugriff**: Zugriff über Web-Browser oder VNC-Client

## 🏗️ Architektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Desktop        │
│   React + MUI   │◄──►│  Node.js + API  │◄──►│  Ubuntu + VNC   │
│   Port: 3003    │    │   Port: 3002    │    │  Dynamic Ports  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Komponenten

- **Frontend**: React.js mit Material-UI, Vite Build-System
- **Backend**: Node.js/Express mit SQLite-Datenbank
- **Desktop**: Ubuntu 22.04 + XFCE4 + TightVNC + noVNC
- **Proxy**: nginx für VNC-Weiterleitung

## 🔧 Konfiguration

### Umgebungsvariablen

```env
# Backend
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
DB_PATH=/app/data/database.sqlite

# Container-Limits
MAX_CONTAINERS_PER_USER=3
CONTAINER_MEMORY_LIMIT=2g
```

### Ports

- **3002**: Backend API
- **3003**: Frontend Web-Interface
- **5900+**: VNC-Server (dynamisch)
- **6080+**: noVNC Web-Interface (dynamisch)

## 📋 API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Benutzerregistrierung
- `POST /api/auth/login` - Anmeldung
- `POST /api/auth/logout` - Abmeldung
- `GET /api/auth/validate` - Token-Validierung

### Container-Management
- `GET /api/containers` - Container auflisten
- `POST /api/containers` - Container erstellen
- `POST /api/containers/:id/start` - Container starten
- `POST /api/containers/:id/stop` - Container stoppen
- `DELETE /api/containers/:id` - Container löschen

### Benutzer (Admin)
- `GET /api/users` - Alle Benutzer (Admin)
- `GET /api/users/profile` - Eigenes Profil
- `GET /api/users/logs` - Aktivitätslogs

## 🛠️ Entwicklung

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

### Desktop-Image bauen

```bash
cd docker/desktop
docker build -t cloud-gaming-desktop .
```

## 📊 Monitoring

### Logs anzeigen

```bash
# Alle Services
docker-compose logs -f

# Einzelne Services
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Container-Status

```bash
docker-compose ps
docker stats
```

## 🔒 Sicherheit

- **JWT-Authentifizierung** mit 24h Ablaufzeit
- **bcrypt-Passwort-Hashing** (12 Runden)
- **Container-Isolation** mit Ressourcenlimits
- **Session-Management** mit Datenbank-Tracking
- **Rate-Limiting** und Security-Header

## 🐛 Fehlerbehebung

### Häufige Probleme

**Port bereits belegt:**
```bash
# Prüfen welcher Prozess den Port verwendet
netstat -tulpn | grep :3002
netstat -tulpn | grep :3003

# Andere Ports verwenden
docker-compose down
# Ports in docker-compose.yml ändern
docker-compose up -d
```

**Docker-Probleme:**
```bash
# Docker-Status prüfen
docker info
docker-compose ps

# Container neu starten
docker-compose restart

# Logs prüfen
docker-compose logs backend
```

**Build-Fehler:**
```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up --build -d
```

### Support

Bei Problemen:
1. Prüfen Sie die Logs: `docker-compose logs`
2. Stellen Sie sicher, dass Docker läuft
3. Prüfen Sie verfügbare Ports
4. Überprüfen Sie Systemressourcen (RAM, Disk)

## 📝 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

---

**Entwickelt mit ❤️ für Cloud Gaming** 