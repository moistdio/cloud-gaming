# Cloud Gaming Platform

A web-based platform for deploying and managing cloud gaming instances using the Steam Headless Docker image. This platform provides dynamic port allocation, display management, and easy access to noVNC and Sunshine streaming.

## Features

### 🚀 **Dynamic Instance Management**
- Create gaming instances on-demand
- Automatic port allocation starting from 12000
- Dynamic X11 display assignment (starting from :55)
- Resource configuration (CPU, Memory, GPU)
- Persistent storage per instance

### 🎮 **Multiple Access Methods**
- **noVNC**: Web-based desktop access directly in browser
- **Sunshine**: High-performance streaming for Moonlight clients
- **Steam Remote Play**: Native Steam streaming support
- **Steam Link**: Mobile and TV streaming

### 🔧 **Management Features**
- Web-based dashboard with modern UI
- Real-time instance monitoring
- Container lifecycle management
- Port and resource tracking
- User-friendly configuration

### 🛡️ **Security & Isolation**
- Isolated containers per instance
- User-specific storage volumes
- Configurable resource limits
- Secure port allocation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Gaming Client  │    │   Mobile App    │
│    (noVNC)      │    │   (Moonlight)    │    │  (Steam Link)   │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │ Port 12000+          │ Ports 12001-12003+   │ Steam Protocol
          │                      │                       │
    ┌─────▼──────────────────────▼───────────────────────▼─────┐
    │              Cloud Gaming Platform                      │
    │                   (Flask App)                           │
    └─────────────────────┬───────────────────────────────────┘
                          │ Docker API
    ┌─────────────────────▼───────────────────────────────────┐
    │                Docker Engine                            │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
    │  │  Instance 1 │  │  Instance 2 │  │  Instance N │     │
    │  │   :55       │  │   :56       │  │   :XX       │     │
    │  │ noVNC 12000 │  │ noVNC 12005 │  │ noVNC 12XXX │     │
    │  │ Sun 12001-3 │  │ Sun 12006-8 │  │ Sun 12XXX-X │     │
    │  └─────────────┘  └─────────────┘  └─────────────┘     │
    └─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- NVIDIA GPU drivers (for GPU acceleration)
- At least 4GB RAM per gaming instance
- Ports 12000-12250 available (each instance uses 4 ports)
- Firewall configured to allow the port range (if accessing remotely)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd cloud-gaming/platform
```

### 2. Deploy the Platform
```bash
# Start the platform
docker-compose -f docker-compose.platform.yml up -d

# Check status
docker-compose -f docker-compose.platform.yml ps
```

### 3. Access the Platform
- **Web Interface**: http://localhost:5000
- **Traefik Dashboard**: http://localhost:8080

### 4. Create Your First Instance
1. Open the web interface
2. Click "Create Instance"
3. Configure resources and settings
4. Wait for deployment (30-60 seconds)
5. Access via noVNC or Sunshine

## Configuration

### Environment Variables
```bash
# Platform Configuration
BASE_PORT=12000              # Starting port for allocation
MAX_INSTANCES=50             # Maximum concurrent instances
DOCKER_IMAGE=josh5/steam-headless:latest

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=false
```

### Instance Configuration Options
- **Memory**: 2GB - 16GB
- **CPU Cores**: 1 - 8 cores
- **GPU Acceleration**: Enable/Disable
- **Audio Support**: Enable/Disable
- **User Password**: Custom password for access

## Port Allocation

The platform automatically allocates ports for each instance:

| Service | Port Range | Purpose |
|---------|------------|---------|
| noVNC | 12000, 12005, 12010... | Web-based desktop access |
| Sunshine HTTPS | 12001, 12006, 12011... | Sunshine secure streaming |
| Sunshine HTTP | 12002, 12007, 12012... | Sunshine web interface |
| Sunshine RTSP | 12003, 12008, 12013... | Sunshine video streaming |

**Display Numbers**: :55, :56, :57... (automatically assigned)

## API Endpoints

### REST API
```bash
# List all instances
GET /api/instances

# Create new instance
POST /api/instances
{
  "user_id": "user123",
  "config": {
    "memory_limit": "4G",
    "cpu_limit": "2",
    "enable_gpu": true,
    "enable_audio": true,
    "user_password": "mypassword"
  }
}

# Delete instance
DELETE /api/instances/{instance_id}
```

## Usage Examples

### Web Browser Access (noVNC)
1. Create an instance
2. Note the noVNC port (e.g., 12000)
3. Open http://localhost:12000 in your browser
4. Use the desktop normally - Steam will auto-start

### Moonlight Streaming
1. Install Moonlight on your device
2. Add PC with host: `localhost`
3. Use the Sunshine port from the instance
4. Login with username: `gamer` and your instance password

### Steam Link
1. Install Steam Link app
2. Scan for computers on your network
3. Select the gaming instance
4. Follow pairing instructions

## Monitoring and Management

### Web Dashboard Features
- **Instance Overview**: Status, resources, ports
- **Real-time Monitoring**: Container status updates
- **Quick Actions**: Start, stop, restart, delete
- **Connection Info**: Easy copy-paste for client setup

### Container Management
```bash
# View running instances
docker ps | grep gaming_

# Check instance logs
docker logs gaming_{instance_id}

# Access instance shell
docker exec -it gaming_{instance_id} bash
```

## Troubleshooting

### Common Issues

**Instance won't start**
- Check Docker daemon is running
- Verify port availability
- Check system resources (RAM/CPU)

**No GPU acceleration**
- Install NVIDIA Docker runtime
- Verify GPU drivers
- Check container GPU access

**Connection refused**
- Wait for container to fully start (30-60s)
- Check firewall settings
- Verify port allocation
- Test port connectivity: `telnet localhost <port>`
- Check if ports are properly forwarded: `docker port gaming_<instance_id>`

**Audio not working**
- Enable audio in instance config
- Check browser audio permissions
- Verify PulseAudio setup

### Logs and Debugging
```bash
# Platform logs
docker-compose -f docker-compose.platform.yml logs -f

# Instance logs
docker logs gaming_{instance_id}

# System resources
docker stats
```

## Advanced Configuration

### Custom Docker Image
```yaml
# In docker-compose.platform.yml
environment:
  - DOCKER_IMAGE=your-custom-image:latest
```

### Resource Limits
```python
# In app.py - modify default_config
default_config = {
    'memory_limit': '8G',
    'cpu_limit': '4',
    'enable_gpu': True,
    'enable_audio': True
}
```

### Network Configuration
```yaml
# Custom network for instances
networks:
  gaming-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## Security Considerations

### Production Deployment
- Change default passwords
- Use HTTPS with proper certificates
- Implement user authentication
- Set up firewall rules
- Monitor resource usage
- Regular security updates

### Access Control
- Implement user management
- Set instance quotas per user
- Monitor and log access
- Use VPN for remote access

## Performance Optimization

### Host System
- Use SSD storage for containers
- Ensure adequate RAM (4GB+ per instance)
- Use dedicated GPU for acceleration
- Optimize network bandwidth

### Container Tuning
- Adjust memory limits based on games
- Use CPU pinning for better performance
- Optimize display resolution
- Configure audio latency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Issues**: Report bugs and feature requests
- **Documentation**: Check the docs/ directory
- **Community**: Join our Discord/Forum

## Acknowledgments

- Based on [Steam Headless](https://github.com/josh5/steam-headless) by josh5
- Uses noVNC for web-based access
- Sunshine for high-performance streaming
- Flask for the web interface 