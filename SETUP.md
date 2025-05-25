# CloudStream Setup Guide

## 🚀 Quick Start

### Prerequisites
1. **Docker Desktop** - Download and install from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Git** (optional) - For cloning the repository
3. **16GB+ RAM** recommended
4. **GPU with drivers** (optional, for game streaming)

### Step 1: Start Docker Desktop
- Install and start Docker Desktop
- Wait for the whale icon in system tray to be stable
- Verify Docker is running: `docker --version`

### Step 2: Quick Setup (Windows)
```powershell
# Navigate to project directory
cd C:\Users\Diony\Documents\cloud-gaming

# Run the setup script
.\scripts\setup.bat
```

### Step 3: Manual Setup (Alternative)
```powershell
# Create environment file
copy env.example .env

# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

## 📋 Access URLs

Once running, access these URLs:

- **Web Interface**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001/health
- **Monitoring (Grafana)**: http://localhost:3002
- **Prometheus**: http://localhost:9090
- **VNC (Streaming Debug)**: localhost:5900

## 👤 Default Accounts

- **Admin**: admin@cloudstream.local / admin123
- **Demo**: demo@cloudstream.local / demo123

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| web | 3000 | Next.js frontend |
| api | 3001 | Express.js backend |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache |
| streaming | 47989, 5900 | Game streaming (simplified) |
| nginx | 80, 443 | Reverse proxy |
| grafana | 3002 | Monitoring dashboard |
| prometheus | 9090 | Metrics collection |
| node-exporter | 9100 | System metrics |

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL="postgresql://cloudstream:cloudstream123@localhost:5432/cloudstream"

# Redis
REDIS_URL="redis://:cloudstream123@localhost:6379"

# Steam API (get from steamcommunity.com/dev/apikey)
STEAM_API_KEY="your-steam-api-key"

# Security
JWT_SECRET="your-super-secret-jwt-key"
```

### GPU Support (Advanced)
To enable full GPU streaming, edit `docker-compose.yml`:
1. Change `dockerfile: docker/streaming/Dockerfile.simple` to `dockerfile: docker/streaming/Dockerfile`
2. Uncomment GPU-related sections
3. Install NVIDIA Container Toolkit

## 🛠️ Troubleshooting

### Docker Not Running
```powershell
# Check Docker status
docker --version
docker ps

# If not working:
# 1. Start Docker Desktop application
# 2. Wait for it to fully initialize
# 3. Try again
```

### Build Failures
```powershell
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Port Conflicts
```powershell
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Stop conflicting services or change ports in docker-compose.yml
```

### Container Logs
```powershell
# View logs for specific service
docker-compose logs api
docker-compose logs web
docker-compose logs streaming

# Follow logs in real-time
docker-compose logs -f
```

## 📊 Monitoring

### Grafana Dashboard
1. Go to http://localhost:3002
2. Login: admin / admin123
3. Navigate to CloudStream dashboard
4. Monitor system performance and streaming metrics

### Prometheus Metrics
1. Go to http://localhost:9090
2. Query metrics like:
   - `cloudstream_api_status`
   - `cloudstream_active_sessions_total`
   - `node_cpu_seconds_total`

## 🎮 Gaming Setup

### Steam Integration
1. Get Steam API key from https://steamcommunity.com/dev/apikey
2. Add to `.env` file: `STEAM_API_KEY="your-key"`
3. Restart services: `docker-compose restart`

### Streaming Quality
Edit `docker-compose.yml` streaming service environment:
```yaml
environment:
  - STREAMING_QUALITY=1080p  # 720p, 1080p, 1440p, 4K
  - STREAMING_FPS=60         # 30, 60, 90, 120
```

## 🔄 Updates

### Updating CloudStream
```powershell
# Pull latest changes
git pull

# Rebuild containers
docker-compose build
docker-compose up -d
```

### Database Migrations
```powershell
# Run migrations
docker-compose exec api npm run db:migrate

# Seed sample data
docker-compose exec api npm run db:seed
```

## 🆘 Support

### Logs Location
- Application logs: `./logs/`
- Docker logs: `docker-compose logs [service]`

### Common Issues
1. **Port 3000 in use**: Change web service port in docker-compose.yml
2. **Database connection failed**: Ensure PostgreSQL is healthy
3. **Streaming not working**: Check VNC on port 5900 for debugging

### Getting Help
1. Check logs: `docker-compose logs`
2. Verify all services: `docker-compose ps`
3. Test individual services: `docker-compose up [service]`

---

**CloudStream** - Your personal cloud gaming platform! 🎮☁️ 