# Cloud Gaming / Remote Desktop System

Ein System, das es Benutzern ermöglicht, eigene Docker-Container mit VNC-Zugang zu virtuellen Desktops zu erstellen und zu verwalten.

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

## Installation

1. Docker und Docker Compose installieren
2. Repository klonen
3. `docker-compose up -d` ausführen
4. Web-Interface unter `http://localhost:3000` aufrufen

## Verwendung

1. Registrierung/Anmeldung über Web-Interface
2. Container erstellen und starten
3. VNC-Verbindung über Browser oder VNC-Client
4. Virtuellen Desktop verwenden

## Ports

- 3000: Web-Interface
- 3001: Backend-API
- 6080+: VNC-Web-Clients (dynamisch zugewiesen)
- 5900+: VNC-Server (dynamisch zugewiesen) 