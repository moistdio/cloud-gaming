# CloudStream - Modern Cloud Gaming Platform

A next-generation self-hosted cloud gaming platform that provides seamless access to your Steam library from anywhere. Built with modern technologies and designed for performance, scalability, and ease of use.

## 🚀 Features

### Core Features
- **Instant Game Access**: Stream your entire Steam library without downloads
- **Multi-User Support**: Secure user management with role-based access
- **Real-time Monitoring**: Live performance metrics and system health
- **Auto-scaling**: Dynamic resource allocation based on demand
- **Cross-platform**: Works on any device with a web browser
- **Low Latency**: Optimized for minimal input lag and high responsiveness

### Advanced Features
- **GPU Acceleration**: NVIDIA/AMD GPU support with hardware encoding
- **Adaptive Streaming**: Dynamic quality adjustment based on network conditions
- **Session Management**: Save and resume gaming sessions
- **Game Library Sync**: Automatic Steam library synchronization
- **Performance Analytics**: Detailed gaming session analytics
- **Mobile Optimized**: Touch controls for mobile gaming

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **React Query** - Server state management
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe backend
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Socket.io** - WebSocket communication
- **JWT** - Authentication
- **Docker** - Containerization

### Infrastructure
- **Docker Compose** - Multi-container orchestration
- **NGINX** - Reverse proxy and load balancing
- **Sunshine** - Game streaming server
- **FFmpeg** - Video encoding
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## 📁 Project Structure

```
cloudstream/
├── apps/
│   ├── web/                    # Next.js frontend
│   ├── api/                    # Express.js backend
│   └── streaming/              # Streaming service
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── database/               # Prisma schema and migrations
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared configuration
├── docker/
│   ├── nginx/                  # NGINX configuration
│   ├── streaming/              # Streaming container setup
│   └── monitoring/             # Prometheus/Grafana setup
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
└── docker-compose.yml          # Main orchestration file
```

## 🚦 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- NVIDIA GPU with drivers (recommended)
- 16GB+ RAM
- Fast internet connection (100+ Mbps recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cloudstream.git
   cd cloudstream
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the platform**
   ```bash
   docker-compose up -d
   ```

4. **Access the platform**
   - Web Interface: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin
   - Monitoring: http://localhost:3001

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development servers**
   ```bash
   npm run dev
   ```

3. **Database setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

## 🎮 Usage

### For Gamers
1. Create an account or sign in
2. Connect your Steam account
3. Browse your game library
4. Click "Play" to start streaming
5. Enjoy gaming from any device!

### For Administrators
1. Access the admin dashboard
2. Monitor system performance
3. Manage user accounts
4. Configure streaming settings
5. View analytics and reports

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cloudstream"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
STEAM_API_KEY="your-steam-api-key"

# Streaming
SUNSHINE_PORT=47989
STREAMING_QUALITY=1080p
STREAMING_FPS=60

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
```

### Performance Tuning
- **GPU Settings**: Configure in `docker/streaming/gpu.conf`
- **Network Settings**: Adjust in `docker/nginx/nginx.conf`
- **Quality Presets**: Modify in `apps/streaming/config/quality.json`

## 📊 Monitoring

The platform includes comprehensive monitoring:
- **System Metrics**: CPU, RAM, GPU usage
- **Network Metrics**: Bandwidth, latency, packet loss
- **Gaming Metrics**: FPS, input lag, session duration
- **User Analytics**: Popular games, usage patterns

Access monitoring at: http://localhost:3001

## 🔒 Security

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS/SSL for all communications
- **Isolation**: Containerized user sessions
- **Audit Logging**: Comprehensive security logs

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/cloudstream/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cloudstream/discussions)
- **Discord**: [Join our community](https://discord.gg/cloudstream)

## 🙏 Acknowledgments

- [Sunshine](https://github.com/LizardByte/Sunshine) - Game streaming server
- [Moonlight](https://moonlight-stream.org/) - Game streaming client
- [Steam](https://store.steampowered.com/) - Gaming platform

---

**CloudStream** - Bringing your games to the cloud, one stream at a time. 🎮☁️ 