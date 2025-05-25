#!/bin/bash

# Cloud Gaming System - Start Script
# Dieses Script startet das komplette Cloud Gaming System

set -e

echo "🚀 Cloud Gaming System wird gestartet..."
echo "=================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Prüfe ob Docker läuft
check_docker() {
    log_info "Prüfe Docker-Installation..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker ist nicht installiert!"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker läuft nicht! Bitte starten Sie Docker."
        exit 1
    fi
    
    log_success "Docker ist verfügbar"
}

# Prüfe ob Docker Compose läuft
check_docker_compose() {
    log_info "Prüfe Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose ist nicht installiert!"
        exit 1
    fi
    
    log_success "Docker Compose ist verfügbar"
}

# Erstelle notwendige Verzeichnisse
create_directories() {
    log_info "Erstelle notwendige Verzeichnisse..."
    
    mkdir -p data
    mkdir -p nginx
    
    log_success "Verzeichnisse erstellt"
}

# Baue Desktop-Image falls nicht vorhanden
build_desktop_image() {
    log_info "Prüfe Desktop-Container-Image..."
    
    if ! docker images | grep -q "cloud-gaming-desktop"; then
        log_info "Desktop-Image wird erstellt..."
        cd docker/desktop
        docker build -t cloud-gaming-desktop .
        cd ../..
        log_success "Desktop-Image erstellt"
    else
        log_success "Desktop-Image bereits vorhanden"
    fi
}

# Stoppe laufende Container
stop_existing() {
    log_info "Stoppe eventuell laufende Container..."
    
    docker-compose down --remove-orphans 2>/dev/null || true
    
    log_success "Alte Container gestoppt"
}

# Starte System
start_system() {
    log_info "Starte Cloud Gaming System..."
    
    # Baue und starte Services
    docker-compose up --build -d
    
    log_success "System gestartet!"
}

# Warte auf Services
wait_for_services() {
    log_info "Warte auf Services..."
    
    # Warte auf Backend
    log_info "Warte auf Backend (Port 3002)..."
    timeout=60
    while ! curl -s http://localhost:3002/api/health &> /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_warning "Backend antwortet nicht nach 60 Sekunden"
            break
        fi
    done
    
    if curl -s http://localhost:3002/api/health &> /dev/null; then
        log_success "Backend ist bereit"
    fi
    
    # Warte auf Frontend
    log_info "Warte auf Frontend (Port 3003)..."
    timeout=60
    while ! curl -s http://localhost:3003 &> /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_warning "Frontend antwortet nicht nach 60 Sekunden"
            break
        fi
    done
    
    if curl -s http://localhost:3003 &> /dev/null; then
        log_success "Frontend ist bereit"
    fi
}

# Zeige Status
show_status() {
    echo ""
    echo "🎮 Cloud Gaming System Status"
    echo "============================="
    
    # Container Status
    echo ""
    log_info "Container Status:"
    docker-compose ps
    
    echo ""
    log_info "Verfügbare Services:"
    echo "  🌐 Frontend:  http://localhost:3003"
    echo "  🔧 Backend:   http://localhost:3002"
    echo "  📊 API Docs:  http://localhost:3002/api/health"
    
    echo ""
    log_info "Erste Schritte:"
    echo "  1. Öffnen Sie http://localhost:3003 in Ihrem Browser"
    echo "  2. Registrieren Sie sich (der erste Benutzer wird Administrator)"
    echo "  3. Erstellen Sie Ihren ersten Desktop-Container"
    
    echo ""
    log_info "Logs anzeigen:"
    echo "  docker-compose logs -f backend"
    echo "  docker-compose logs -f frontend"
    
    echo ""
    log_info "System stoppen:"
    echo "  docker-compose down"
}

# Hauptfunktion
main() {
    echo ""
    log_info "Starte Cloud Gaming System Setup..."
    
    check_docker
    check_docker_compose
    create_directories
    build_desktop_image
    stop_existing
    start_system
    wait_for_services
    show_status
    
    echo ""
    log_success "🎉 Cloud Gaming System erfolgreich gestartet!"
    echo ""
}

# Script ausführen
main "$@" 