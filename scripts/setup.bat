@echo off
echo 🚀 Setting up CloudStream Platform...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating environment file...
    copy env.example .env
    echo ✅ Environment file created. Please edit .env with your configuration.
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist uploads mkdir uploads
if not exist logs mkdir logs

REM Create SSL directory for NGINX
if not exist docker\nginx\ssl (
    echo 🔐 Creating SSL directory...
    mkdir docker\nginx\ssl
    echo ⚠️  Please generate SSL certificates manually or use the Linux setup script.
)

REM Build and start services
echo 🐳 Building Docker containers...
docker-compose build

echo 🚀 Starting CloudStream services...
docker-compose up -d

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak >nul

REM Run database migrations and seed
echo 🗄️ Setting up database...
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed

echo.
echo 🎉 CloudStream setup complete!
echo.
echo 📋 Access URLs:
echo    Web Interface: http://localhost:3000
echo    API: http://localhost:3001
echo    Monitoring: http://localhost:3001 (Grafana)
echo    Prometheus: http://localhost:9090
echo.
echo 👤 Default accounts:
echo    Admin: admin@cloudstream.local / admin123
echo    Demo:  demo@cloudstream.local / demo123
echo.
echo 🔧 Next steps:
echo    1. Edit .env file with your Steam API key
echo    2. Configure your GPU drivers for streaming
echo    3. Access the web interface and start gaming!
echo.
pause 