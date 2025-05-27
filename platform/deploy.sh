#!/bin/bash

# Cloud Gaming Platform Deployment Script
# This script sets up and deploys the cloud gaming platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM_NAME="Cloud Gaming Platform"
BASE_PORT=${BASE_PORT:-12000}
MAX_INSTANCES=${MAX_INSTANCES:-50}
DOCKER_IMAGE=${DOCKER_IMAGE:-"josh5/steam-headless:latest"}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  $PLATFORM_NAME Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. Consider using a non-root user for better security."
    fi
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    # Check available memory
    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -lt 8 ]; then
        print_warning "System has less than 8GB RAM. Performance may be limited."
        print_warning "Recommended: 8GB+ RAM for optimal gaming experience."
    fi
    
    # Check available disk space
    AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -lt 50 ]; then
        print_warning "Less than 50GB disk space available. Consider freeing up space."
    fi
    
    print_status "System requirements check completed."
}

# Check GPU support
check_gpu() {
    print_status "Checking GPU support..."
    
    if command -v nvidia-smi &> /dev/null; then
        print_status "NVIDIA GPU detected:"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
        
        # Check NVIDIA Docker runtime
        if docker info 2>/dev/null | grep -q nvidia; then
            print_status "NVIDIA Docker runtime is available."
        else
            print_warning "NVIDIA Docker runtime not detected. GPU acceleration may not work."
            print_warning "Install nvidia-docker2 for GPU support."
        fi
    else
        print_warning "No NVIDIA GPU detected. Gaming instances will run without GPU acceleration."
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p data config traefik
    
    # Create Traefik configuration
    cat > traefik/traefik.yml << EOF
api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@localhost
      storage: /etc/traefik/acme.json
      httpChallenge:
        entryPoint: web
EOF
    
    print_status "Directories created successfully."
}

# Pull required Docker images
pull_images() {
    print_status "Pulling required Docker images..."
    
    # Pull the gaming image
    print_status "Pulling gaming image: $DOCKER_IMAGE"
    docker pull "$DOCKER_IMAGE"
    
    # Pull platform dependencies
    print_status "Pulling platform dependencies..."
    docker pull redis:7-alpine
    docker pull traefik:v2.10
    
    print_status "Docker images pulled successfully."
}

# Generate configuration
generate_config() {
    print_status "Generating configuration..."
    
    # Create environment file
    cat > .env << EOF
# Cloud Gaming Platform Configuration
BASE_PORT=$BASE_PORT
MAX_INSTANCES=$MAX_INSTANCES
DOCKER_IMAGE=$DOCKER_IMAGE
FLASK_ENV=production
FLASK_DEBUG=false

# Security (Change these in production!)
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_PASSWORD=admin123

# Database
DATABASE_URL=sqlite:///data/instances.db

# Redis
REDIS_URL=redis://redis:6379/0
EOF
    
    print_status "Configuration generated successfully."
}

# Deploy the platform
deploy_platform() {
    print_status "Deploying the platform..."
    
    # Build and start services
    docker-compose -f docker-compose.platform.yml up -d --build
    
    print_status "Platform deployed successfully."
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for platform to be ready
    for i in {1..30}; do
        if curl -s http://localhost:5000 > /dev/null 2>&1; then
            print_status "Platform is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo
    
    # Check if services are running
    if ! curl -s http://localhost:5000 > /dev/null 2>&1; then
        print_error "Platform failed to start. Check logs with: docker-compose -f docker-compose.platform.yml logs"
        exit 1
    fi
}

# Display deployment information
show_deployment_info() {
    echo
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Completed Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  🌐 Platform Dashboard: ${YELLOW}http://localhost:5000${NC}"
    echo -e "  📊 Traefik Dashboard:  ${YELLOW}http://localhost:8080${NC}"
    echo
    echo -e "${BLUE}Configuration:${NC}"
    echo -e "  🚀 Base Port:          ${YELLOW}$BASE_PORT${NC}"
    echo -e "  📦 Max Instances:      ${YELLOW}$MAX_INSTANCES${NC}"
    echo -e "  🎮 Gaming Image:       ${YELLOW}$DOCKER_IMAGE${NC}"
    echo
    echo -e "${BLUE}Port Allocation:${NC}"
    echo -e "  🖥️  noVNC Ports:        ${YELLOW}$BASE_PORT, $((BASE_PORT+5)), $((BASE_PORT+10))...${NC}"
    echo -e "  ☀️  Sunshine Ports:     ${YELLOW}$((BASE_PORT+1))-$((BASE_PORT+3)), $((BASE_PORT+6))-$((BASE_PORT+8))...${NC}"
    echo -e "  📡 Each instance uses 4 ports (1 noVNC + 3 Sunshine)${NC}"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Open ${YELLOW}http://localhost:5000${NC} in your browser"
    echo -e "  2. Click '${YELLOW}Create Instance${NC}' to deploy your first gaming container"
    echo -e "  3. Configure resources and wait for deployment"
    echo -e "  4. Access via noVNC or connect with Moonlight/Steam Link"
    echo
    echo -e "${BLUE}Management Commands:${NC}"
    echo -e "  📋 View logs:          ${YELLOW}docker-compose -f docker-compose.platform.yml logs -f${NC}"
    echo -e "  🔄 Restart platform:   ${YELLOW}docker-compose -f docker-compose.platform.yml restart${NC}"
    echo -e "  🛑 Stop platform:      ${YELLOW}docker-compose -f docker-compose.platform.yml down${NC}"
    echo -e "  📊 View containers:    ${YELLOW}docker ps${NC}"
    echo
    echo -e "${GREEN}Happy Gaming! 🎮${NC}"
    echo
}

# Cleanup function
cleanup() {
    print_status "Cleaning up temporary files..."
    # Add cleanup logic here if needed
}

# Main deployment function
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    echo
    
    check_root
    check_requirements
    check_gpu
    create_directories
    generate_config
    pull_images
    deploy_platform
    wait_for_services
    show_deployment_info
    
    # Set up cleanup trap
    trap cleanup EXIT
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping the platform..."
        docker-compose -f docker-compose.platform.yml down
        print_status "Platform stopped."
        ;;
    "restart")
        print_status "Restarting the platform..."
        docker-compose -f docker-compose.platform.yml restart
        print_status "Platform restarted."
        ;;
    "logs")
        print_status "Showing platform logs..."
        docker-compose -f docker-compose.platform.yml logs -f
        ;;
    "status")
        print_status "Platform status:"
        docker-compose -f docker-compose.platform.yml ps
        ;;
    "update")
        print_status "Updating the platform..."
        docker-compose -f docker-compose.platform.yml pull
        docker-compose -f docker-compose.platform.yml up -d
        print_status "Platform updated."
        ;;
    "clean")
        print_warning "This will remove all instances and data. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_status "Cleaning up platform..."
            docker-compose -f docker-compose.platform.yml down -v
            docker system prune -f
            rm -rf data/
            print_status "Platform cleaned."
        else
            print_status "Cleanup cancelled."
        fi
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [COMMAND]"
        echo
        echo "Commands:"
        echo "  (no args)  Deploy the platform"
        echo "  stop       Stop the platform"
        echo "  restart    Restart the platform"
        echo "  logs       Show platform logs"
        echo "  status     Show platform status"
        echo "  update     Update the platform"
        echo "  clean      Remove all data (destructive)"
        echo "  help       Show this help message"
        echo
        echo "Environment Variables:"
        echo "  BASE_PORT      Starting port for allocation (default: 12000)"
        echo "  MAX_INSTANCES  Maximum concurrent instances (default: 50)"
        echo "  DOCKER_IMAGE   Gaming container image (default: josh5/steam-headless:latest)"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac 