#!/usr/bin/env python3
"""
Startup script for the Cloud Gaming Platform
Runs the platform directly on the host system for better Docker integration
"""

import os
import sys
import subprocess
import time

def check_requirements():
    """Check if all requirements are met"""
    print("🔍 Checking requirements...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    
    # Check if Docker is available
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Docker found: {result.stdout.strip()}")
        else:
            print("❌ Docker not found or not running")
            return False
    except FileNotFoundError:
        print("❌ Docker not found in PATH")
        return False
    
    # Check if Docker daemon is running
    try:
        result = subprocess.run(['docker', 'info'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker daemon is running")
        else:
            print("❌ Docker daemon is not running")
            return False
    except Exception:
        print("❌ Cannot connect to Docker daemon")
        return False
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    
    try:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                      check=True, capture_output=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    directories = ['data', 'config']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def start_redis():
    """Start Redis container for session management"""
    print("🔴 Starting Redis...")
    
    try:
        # Check if Redis container already exists
        result = subprocess.run(['docker', 'ps', '-a', '--filter', 'name=gaming-platform-redis', '--format', '{{.Names}}'], 
                              capture_output=True, text=True)
        
        if 'gaming-platform-redis' in result.stdout:
            # Container exists, start it
            subprocess.run(['docker', 'start', 'gaming-platform-redis'], check=True, capture_output=True)
            print("✅ Redis container started")
        else:
            # Create new Redis container
            subprocess.run([
                'docker', 'run', '-d',
                '--name', 'gaming-platform-redis',
                '--restart', 'unless-stopped',
                '-p', '6379:6379',
                'redis:7-alpine',
                'redis-server', '--appendonly', 'yes'
            ], check=True, capture_output=True)
            print("✅ Redis container created and started")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start Redis: {e}")
        return False

def start_platform():
    """Start the Flask platform"""
    print("🚀 Starting Cloud Gaming Platform...")
    
    # Set environment variables
    env = os.environ.copy()
    env.update({
        'FLASK_ENV': 'production',
        'FLASK_DEBUG': 'false',
        'BASE_PORT': '12000',
        'MAX_INSTANCES': '50',
        'DOCKER_IMAGE': 'josh5/steam-headless:latest'
    })
    
    try:
        # Start the Flask app
        print("🌐 Platform will be available at: http://localhost:15000")
        print("📊 Press Ctrl+C to stop the platform")
        print("-" * 50)
        
        # Change the port in app.py to 15000 for consistency
        subprocess.run([sys.executable, 'app.py'], env=env, check=True)
        
    except KeyboardInterrupt:
        print("\n🛑 Platform stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Platform failed to start: {e}")
        return False
    
    return True

def main():
    """Main startup function"""
    print("🎮 Cloud Gaming Platform Startup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not os.path.exists('app.py'):
        print("❌ Please run this script from the platform directory")
        sys.exit(1)
    
    # Check requirements
    if not check_requirements():
        print("❌ Requirements check failed")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Start Redis
    if not start_redis():
        print("❌ Failed to start Redis")
        sys.exit(1)
    
    # Wait a moment for Redis to be ready
    print("⏳ Waiting for Redis to be ready...")
    time.sleep(3)
    
    # Start platform
    start_platform()

if __name__ == "__main__":
    main() 