#!/bin/bash

# CloudStream Setup Script
echo "🚀 Setting up CloudStream Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "✅ Environment file created. Please edit .env with your configuration."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads logs

# Generate SSL certificates for NGINX (self-signed)
if [ ! -d "docker/nginx/ssl" ]; then
    echo "🔐 Generating SSL certificates..."
    mkdir -p docker/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/nginx/ssl/key.pem \
        -out docker/nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=CloudStream/CN=localhost"
fi

# Generate Sunshine certificates
if [ ! -d "docker/streaming/config/certs" ]; then
    echo "🔐 Generating Sunshine certificates..."
    mkdir -p docker/streaming/config/certs
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/streaming/config/sunshine.key \
        -out docker/streaming/config/sunshine.cert \
        -subj "/C=US/ST=State/L=City/O=CloudStream/CN=sunshine"
fi

# Build and start services
echo "🐳 Building Docker containers..."
docker-compose build

echo "🚀 Starting CloudStream services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations and seed
echo "🗄️ Setting up database..."
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed

echo ""
echo "🎉 CloudStream setup complete!"
echo ""
echo "📋 Access URLs:"
echo "   Web Interface: http://localhost:3000"
echo "   API: http://localhost:3001"
echo "   Monitoring: http://localhost:3001 (Grafana)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "👤 Default accounts:"
echo "   Admin: admin@cloudstream.local / admin123"
echo "   Demo:  demo@cloudstream.local / demo123"
echo ""
echo "🔧 Next steps:"
echo "   1. Edit .env file with your Steam API key"
echo "   2. Configure your GPU drivers for streaming"
echo "   3. Access the web interface and start gaming!"
echo "" 