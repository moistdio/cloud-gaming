# CloudStream Troubleshooting Guide

## 🐳 Docker Issues

### Docker Not Running
**Symptoms**: `docker --version` returns nothing or `docker ps` fails

**Solutions**:
1. **Start Docker Desktop**
   - Open Docker Desktop application from Start Menu
   - Wait for the whale icon in system tray to be stable (not spinning)
   - Should show "Docker Desktop is running"

2. **Check Docker Service**
   ```powershell
   # Check if Docker service is running
   Get-Service -Name "Docker Desktop Service"
   
   # Start Docker service if stopped
   Start-Service -Name "Docker Desktop Service"
   ```

3. **Restart Docker Desktop**
   - Right-click Docker whale icon in system tray
   - Select "Restart Docker Desktop"
   - Wait for it to fully start

4. **Reinstall Docker Desktop**
   - Download latest from https://www.docker.com/products/docker-desktop/
   - Uninstall old version first
   - Install with admin privileges

### Docker Build Failures

#### Issue: `tsc: not found`
**Cause**: TypeScript compiler not available in production dependencies

**Solution**: Use simplified Dockerfiles
```yaml
# In docker-compose.yml, change:
dockerfile: apps/api/Dockerfile.simple
dockerfile: apps/web/Dockerfile.simple
```

#### Issue: `npm ci` requires package-lock.json
**Cause**: No lockfile present

**Solution**: Use `npm install` instead of `npm ci`
```dockerfile
# Change in Dockerfile:
RUN npm install  # instead of npm ci
```

#### Issue: Workspace dependencies not found
**Cause**: Monorepo workspace setup issues

**Solution**: Use simplified single-app Dockerfiles
- `apps/api/Dockerfile.simple`
- `apps/web/Dockerfile.simple`

## 🔧 Build Issues

### Container Build Errors

#### Clean Docker Environment
```powershell
# Stop all containers
docker-compose down

# Remove all containers and images
docker system prune -a -f

# Remove volumes (WARNING: deletes data)
docker volume prune -f

# Rebuild from scratch
docker-compose build --no-cache
```

#### Build Individual Services
```powershell
# Build only API
docker-compose build api

# Build only Web
docker-compose build web

# Build only Streaming
docker-compose build streaming
```

### Port Conflicts

#### Check Port Usage
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Check what's using port 3001
netstat -ano | findstr :3001

# Kill process using port (replace PID)
taskkill /PID 1234 /F
```

#### Change Ports
Edit `docker-compose.yml`:
```yaml
services:
  web:
    ports:
      - "3010:3000"  # Change external port
  api:
    ports:
      - "3011:3001"  # Change external port
```

## 🗄️ Database Issues

### PostgreSQL Connection Failed
```powershell
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Database Migration Errors
```powershell
# Reset database (WARNING: deletes data)
docker-compose down
docker volume rm cloudstream_postgres_data
docker-compose up -d postgres

# Wait for DB to be ready, then migrate
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed
```

## 🌐 Network Issues

### Services Can't Communicate
```powershell
# Check network
docker network ls
docker network inspect cloudstream_cloudstream-network

# Restart networking
docker-compose down
docker-compose up -d
```

### DNS Resolution Issues
```powershell
# Test service connectivity
docker-compose exec api ping postgres
docker-compose exec web ping api
```

## 📊 Monitoring Issues

### Grafana Not Accessible
```powershell
# Check Grafana status
docker-compose ps grafana

# View Grafana logs
docker-compose logs grafana

# Reset Grafana data
docker volume rm cloudstream_grafana_data
docker-compose restart grafana
```

### Prometheus Not Collecting Metrics
```powershell
# Check Prometheus config
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml

# Check targets
# Go to http://localhost:9090/targets
```

## 🎮 Streaming Issues

### VNC Not Working
```powershell
# Check streaming service
docker-compose ps streaming

# View streaming logs
docker-compose logs streaming

# Test VNC connection
# Use VNC viewer to connect to localhost:5900
```

### GPU Not Detected
**For full GPU streaming**:
1. Install NVIDIA Container Toolkit
2. Change to full Dockerfile:
   ```yaml
   dockerfile: docker/streaming/Dockerfile
   ```
3. Add GPU support:
   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: 1
             capabilities: [gpu]
   ```

## 🚀 Quick Fixes

### Complete Reset
```powershell
# Nuclear option - reset everything
docker-compose down -v
docker system prune -a -f
docker volume prune -f

# Start fresh
copy env.example .env
docker-compose build --no-cache
docker-compose up -d
```

### Minimal Setup
```powershell
# Start only essential services
docker-compose up -d postgres redis api web

# Skip streaming and monitoring for now
# Add them later once basic setup works
```

### Check Everything is Working
```powershell
# Check all services
docker-compose ps

# Check logs
docker-compose logs --tail=50

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3000
```

## 📞 Getting Help

### Collect Debug Information
```powershell
# System info
docker version
docker-compose version
systeminfo | findstr /C:"OS Name" /C:"OS Version"

# Service status
docker-compose ps
docker-compose logs --tail=100

# Network info
docker network ls
ipconfig
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `docker daemon not running` | Docker Desktop not started | Start Docker Desktop |
| `port already in use` | Another service using port | Change port or kill process |
| `tsc: not found` | Missing TypeScript | Use simplified Dockerfile |
| `ECONNREFUSED` | Service not ready | Wait longer or check dependencies |
| `permission denied` | File permissions | Run as administrator |

---

**Need more help?** Check the logs first: `docker-compose logs [service]` 