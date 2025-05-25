# 🎮 Cloud Gaming / Remote Desktop System

Ein vollständiges Cloud-Gaming und Remote-Desktop-System mit **GPU-Beschleunigung**, das es Benutzern ermöglicht, virtuelle Desktop-Container mit VNC-Zugriff und Hardware-beschleunigtem Gaming auf einem headless Server zu erstellen und zu verwalten.

## 🌟 Features

### 🎮 GPU-Beschleunigung (NEU!)
- **NVIDIA GPU-Unterstützung**: Vollständige Integration von NVIDIA-Grafikkarten
- **CUDA-Beschleunigung**: Hardware-beschleunigte Berechnungen und Gaming
- **OpenGL & Vulkan**: Moderne 3D-Grafik-APIs für optimale Performance
- **Hardware-Video-Encoding**: Effiziente Streaming-Übertragung
- **Gaming-optimiert**: Steam, Wine, und moderne Spiele-Unterstützung

### 🖥️ Container-Management
- **Ein Container pro Benutzer**: Jeder Benutzer kann einen persönlichen Desktop-Container erstellen
- **VNC-Zugriff**: Port-Bereich 11000-11430 für VNC-Server
- **Web-VNC**: Browser-basierter Zugriff über noVNC (Port-Bereich 12000-12430)
- **Ubuntu 22.04 + XFCE4**: Vollständige Desktop-Umgebung mit GPU-Beschleunigung
- **Automatische Port-Zuweisung**: Keine Konflikte zwischen Containern
- **Skalierbarkeit**: Unterstützt bis zu 430 gleichzeitige Container

### 👥 Benutzerverwaltung
- **Admin-System**: Erster Benutzer wird automatisch Administrator
- **JWT-Authentifizierung**: Sichere Token-basierte Anmeldung
- **Rollenverwaltung**: Admin- und Standard-Benutzer-Rollen

### 🛠️ Technische Features
- **Docker-Integration**: Vollständige Container-Verwaltung über Docker API
- **NVIDIA Container Runtime**: Nahtlose GPU-Integration in Container
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
                              ▼                        │
                       ┌─────────────────┐             │
                       │   SQLite DB     │             │
                       │   + Docker API  │             │
                       └─────────────────┘             │
                                                       ▼
                                               ┌─────────────────┐
                                               │   NVIDIA GPU    │
                                               │   + CUDA        │
                                               │   + OpenGL      │
                                               └─────────────────┘
```

## 🚀 Schnellstart

### Voraussetzungen
- **Docker & Docker Compose** mit NVIDIA Container Runtime
- **NVIDIA GPU** mit aktuellen Treibern (535+)
- **CUDA 12.2+** (wird automatisch installiert)
- **Git**
- **Mindestens 8GB RAM** (für GPU-Workloads)
- **Linux/Windows mit WSL2**

### 1. GPU-Setup (Automatisch)

**Linux/WSL2:**
```bash
chmod +x setup-gpu.sh
./setup-gpu.sh
```

**Windows:**
```powershell
.\setup-gpu.ps1
```

**Manuell (Ubuntu/Debian):**
```bash
# NVIDIA Container Toolkit installieren
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

**Testen:**
```bash
docker run --rm --gpus all nvidia/cuda:12.2-base-ubuntu22.04 nvidia-smi
```

### 2. Repository klonen
```bash
git clone <repository-url>
cd cloud-gaming
git checkout feature/gpu-integration
```

### 3. Desktop-Image bauen
```bash
# Linux/macOS
chmod +x build-desktop-image.sh
./build-desktop-image.sh

# Windows PowerShell
.\build-desktop-image.ps1
```

### 4. System starten
```bash
# Alle Services starten
docker-compose up -d

# Logs verfolgen
docker-compose logs -f
```

### 5. Zugriff
- **Web-Interface**: http://localhost:3003
- **API**: http://localhost:3002

## 📋 Erste Schritte

### 1. Administrator-Account erstellen
1. Öffnen Sie http://localhost:3003
2. Klicken Sie auf "Registrieren"
3. Der erste Benutzer wird automatisch Administrator

### 2. GPU-Status prüfen
1. Navigieren Sie zu "Mein Container"
2. Überprüfen Sie den GPU-Status im Dashboard
3. Stellen Sie sicher, dass NVIDIA-Treiber erkannt werden

### 3. Desktop-Container erstellen
1. Klicken Sie "Container erstellen"
2. Geben Sie einen Namen ein
3. Warten Sie auf die GPU-Initialisierung

### 4. Gaming-Desktop verwenden
1. Starten Sie den Container
2. Klicken Sie "Desktop öffnen" für Web-VNC
3. Oder verwenden Sie einen VNC-Client mit dem angezeigten Port
4. Testen Sie GPU-Beschleunigung mit `glxinfo` oder `nvidia-smi`

## 🎮 Gaming & GPU-Features

### Vorinstallierte Gaming-Software
- **Steam**: Vollständige Steam-Installation
- **Wine**: Windows-Spiele unter Linux
- **Lutris**: Gaming-Plattform-Manager
- **GPU-Benchmarks**: glmark2, Unigine Heaven

### GPU-Monitoring
- **nvidia-smi**: GPU-Status und -Auslastung
- **nvtop**: Interaktives GPU-Monitoring
- **Desktop-Shortcuts**: Schnellzugriff auf GPU-Tools

### Unterstützte APIs
- **OpenGL 4.6+**: Moderne 3D-Grafik
- **Vulkan**: High-Performance-Grafik-API
- **CUDA 12.2+**: GPU-Computing
- **VA-API/VDPAU**: Hardware-Video-Beschleunigung

## 🔧 Konfiguration

### GPU-spezifische Umgebungsvariablen
```bash
# Container-Umgebung
NVIDIA_VISIBLE_DEVICES=all
NVIDIA_DRIVER_CAPABILITIES=all
LIBGL_ALWAYS_INDIRECT=0
LIBGL_ALWAYS_SOFTWARE=0

# Performance-Optimierung
__GL_SYNC_TO_VBLANK=1
__GL_YIELD=USLEEP
VDPAU_DRIVER=nvidia
```

### Container-Ressourcen
- **RAM**: 4GB (erhöht für GPU-Workloads)
- **Shared Memory**: 2GB (für GPU-Anwendungen)
- **CPU**: 2048 Shares (Gaming-optimiert)
- **GPU**: Vollzugriff auf alle verfügbaren GPUs

### Port-Bereiche
- **Frontend**: 3003
- **Backend**: 3002
- **VNC-Server**: 11000-11430
- **Web-VNC**: 12000-12430

## 🛠️ Entwicklung

### GPU-Integration testen
```bash
# GPU-Status prüfen
curl http://localhost:3002/api/containers/gpu-status

# Container mit GPU erstellen
curl -X POST http://localhost:3002/api/containers/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"containerName": "GPU Test"}'
```

### Desktop-Image anpassen
```bash
cd docker/desktop
# Dockerfile bearbeiten für zusätzliche GPU-Software
docker build -t cloud-gaming-desktop:dev .
```

### GPU-Initialisierung debuggen
```bash
# Container-Logs prüfen
docker logs <container-id>

# GPU-Init-Script testen
docker exec -it <container-id> /usr/local/bin/gpu-init.sh
```

## 📊 API-Endpunkte

### GPU-Management
- `GET /api/containers/gpu-status` - GPU-Status abrufen
- `POST /api/containers/create` - Container mit GPU erstellen
- `GET /api/containers/logs` - Container-Logs (Admin)

### Container-Management
- `GET /api/containers` - Container abrufen
- `POST /api/containers/start` - Container starten
- `POST /api/containers/stop` - Container stoppen
- `DELETE /api/containers` - Container löschen
- `POST /api/containers/regenerate-password` - VNC-Passwort erneuern

## 🔒 Sicherheit

### GPU-Sicherheit
- **Capability-basierte Berechtigung**: Nur notwendige GPU-Capabilities
- **Container-Isolation**: Jeder Benutzer hat eigenen GPU-Zugriff
- **Ressourcen-Limits**: Verhindert GPU-Monopolisierung

### Allgemeine Sicherheit
- **JWT-Token**: Sichere Authentifizierung
- **Passwort-Hashing**: bcrypt für Passwort-Sicherheit
- **Container-Isolation**: Jeder Benutzer hat eigenen Container
- **Port-Isolation**: Automatische Port-Zuweisung verhindert Konflikte

## 🐛 Fehlerbehebung

### GPU-Probleme
```bash
# NVIDIA-Treiber prüfen
nvidia-smi

# Container Runtime prüfen
docker run --rm --gpus all nvidia/cuda:12.2-base-ubuntu22.04 nvidia-smi

# Container-GPU-Zugriff testen
docker exec -it <container-id> nvidia-smi
```

### Container startet nicht
```bash
# Logs prüfen
docker-compose logs backend

# GPU-Image neu bauen
./build-desktop-image.sh

# Docker-Compose neu starten
docker-compose down && docker-compose up -d
```

### Performance-Probleme
```bash
# GPU-Auslastung prüfen
nvidia-smi -l 1

# Container-Ressourcen prüfen
docker stats

# GPU-Memory prüfen
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

## 📁 Projektstruktur

```
cloud-gaming/
├── backend/                 # Node.js API Server
│   ├── routes/
│   │   └── containers.js    # GPU-Container-Management
│   ├── middleware/          # Auth & Validation
│   ├── database/           # SQLite Setup
│   └── utils/              # Hilfsfunktionen
├── frontend/               # React Web-App
│   ├── src/
│   │   ├── pages/
│   │   │   └── ContainersPage.jsx  # GPU-Status-Integration
│   │   ├── components/
│   │   │   └── GPUStatus.jsx       # GPU-Status-Component
│   │   ├── contexts/       # React Contexts
│   │   └── services/       # API-Services
├── docker/
│   └── desktop/            # GPU-Desktop-Container
│       ├── Dockerfile      # Ubuntu + XFCE4 + GPU
│       ├── gpu-init.sh     # GPU-Initialisierung
│       └── start-desktop.sh # GPU-Desktop-Start
├── data/                   # Persistente Daten
└── docker-compose.yml     # GPU-Service-Orchestrierung
```

## 🎯 Roadmap

### Geplante Features
- [ ] **Multi-GPU-Support**: Verteilung auf mehrere GPUs
- [ ] **GPU-Scheduling**: Intelligente GPU-Zuweisung
- [ ] **Performance-Monitoring**: Detaillierte GPU-Metriken
- [ ] **Cloud-Streaming**: Optimierte Video-Übertragung
- [ ] **VR-Support**: Virtual Reality Unterstützung

### Gaming-Erweiterungen
- [ ] **Game-Launcher**: Integrierte Spiele-Bibliothek
- [ ] **Save-Game-Sync**: Cloud-Speicherstand-Synchronisation
- [ ] **Multiplayer-Lobbies**: Gemeinsame Gaming-Sessions
- [ ] **Streaming-Integration**: Twitch/YouTube-Streaming

## 🤝 Beitragen

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/gpu-enhancement`)
3. Committen Sie Ihre Änderungen
4. Erstellen Sie eine Pull Request

## 📄 Lizenz

MIT License - siehe LICENSE-Datei für Details.

## 🆘 Support

Bei GPU-spezifischen Problemen:
1. Prüfen Sie die NVIDIA-Treiber: `nvidia-smi`
2. Testen Sie Docker-GPU-Zugriff: `docker run --rm --gpus all nvidia/cuda:12.2-base-ubuntu22.04 nvidia-smi`
3. Überprüfen Sie die Container-Logs: `docker-compose logs`
4. Erstellen Sie ein Issue mit GPU-Informationen

---

**Hinweis**: Dieses System ist für GPU-beschleunigtes Gaming und professionelle Anwendungen optimiert. Für Produktionsumgebungen sollten zusätzliche Sicherheitsmaßnahmen und Monitoring implementiert werden. 