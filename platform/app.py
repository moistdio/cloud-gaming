from flask import Flask, render_template, request, jsonify, redirect, url_for
import docker
import json
import os
import sqlite3
import threading
import time
from datetime import datetime
import uuid
import logging

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'

# Configuration
BASE_PORT = 12000
MAX_INSTANCES = 50
DOCKER_IMAGE = 'josh5/steam-headless:latest'

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Docker client
try:
    docker_client = docker.from_env()
    # Test connection
    docker_client.ping()
    logger.info("Docker client connected successfully")
except Exception as e:
    logger.error(f"Failed to connect to Docker: {e}")
    # Try alternative connection methods
    try:
        docker_client = docker.DockerClient(base_url='unix://var/run/docker.sock')
        docker_client.ping()
        logger.info("Docker client connected via unix socket")
    except Exception as e2:
        logger.error(f"Failed to connect to Docker via unix socket: {e2}")
        raise Exception("Cannot connect to Docker daemon")

class InstanceManager:
    def __init__(self):
        self.init_db()
        self.port_allocator = PortAllocator()
        self.display_allocator = DisplayAllocator()
        
    def init_db(self):
        """Initialize SQLite database for instance management"""
        conn = sqlite3.connect('instances.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS instances (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                container_id TEXT,
                novnc_port INTEGER,
                sunshine_port INTEGER,
                display_number INTEGER,
                status TEXT,
                created_at TIMESTAMP,
                last_accessed TIMESTAMP,
                config TEXT
            )
        ''')
        conn.commit()
        conn.close()
    
    def create_instance(self, user_id, config=None):
        """Create a new gaming instance"""
        try:
            instance_id = str(uuid.uuid4())
            novnc_port = self.port_allocator.allocate_port()
            sunshine_ports = self.port_allocator.allocate_sunshine_ports()
            display_num = self.display_allocator.allocate_display()
            
            if not novnc_port or not sunshine_ports or display_num is None:
                return None, "No available ports or displays"
            
            sunshine_port = sunshine_ports[0]  # Main Sunshine port
            
            # Default configuration
            default_config = {
                'memory_limit': '4G',
                'cpu_limit': '2',
                'enable_gpu': True,
                'enable_audio': True,
                'user_password': 'gaming123'
            }
            
            if config:
                default_config.update(config)
            
            # Create container
            container = self.create_container(
                instance_id, novnc_port, sunshine_port, display_num, default_config
            )
            
            if not container:
                self.port_allocator.release_port(novnc_port)
                self.port_allocator.release_sunshine_ports(sunshine_port)
                self.display_allocator.release_display(display_num)
                return None, "Failed to create container"
            
            # Save to database
            conn = sqlite3.connect('instances.db')
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO instances 
                (id, user_id, container_id, novnc_port, sunshine_port, display_number, 
                 status, created_at, last_accessed, config)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                instance_id, user_id, container.id, novnc_port, sunshine_port,
                display_num, 'starting', datetime.now(), datetime.now(),
                json.dumps(default_config)
            ))
            conn.commit()
            conn.close()
            
            logger.info(f"Created instance {instance_id} for user {user_id}")
            return instance_id, None
            
        except Exception as e:
            logger.error(f"Error creating instance: {str(e)}")
            return None, str(e)
    
    def create_container(self, instance_id, novnc_port, sunshine_port, display_num, config):
        """Create Docker container for the gaming instance"""
        try:
            # Create volumes
            home_volume = f"gaming_home_{instance_id}"
            games_volume = f"gaming_games_{instance_id}"
            
            # Environment variables
            environment = {
                'NAME': f'Gaming-{instance_id[:8]}',
                'TZ': 'UTC',
                'USER_LOCALES': 'en_US.UTF-8 UTF-8',
                'DISPLAY': f':{display_num}',
                'SHM_SIZE': '2G',
                'PUID': '1000',
                'PGID': '1000',
                'UMASK': '000',
                'USER_PASSWORD': config.get('user_password', 'gaming123'),
                'MODE': 'primary',
                'WEB_UI_MODE': 'vnc',
                'ENABLE_VNC_AUDIO': str(config.get('enable_audio', True)).lower(),
                'PORT_NOVNC_WEB': str(novnc_port),
                'NEKO_NAT1TO1': '',
                'ENABLE_SUNSHINE': 'true',
                'SUNSHINE_USER': 'gamer',
                'SUNSHINE_PASS': config.get('user_password', 'gaming123'),
                'SUNSHINE_EXTERNAL_IP': '0.0.0.0',
                'SUNSHINE_PORT': str(sunshine_port),

                'ENABLE_EVDEV_INPUTS': 'true',
                'FORCE_X11_DUMMY_CONFIG': 'true',
                'NVIDIA_DRIVER_CAPABILITIES': 'all',
                'NVIDIA_VISIBLE_DEVICES': 'all' if config.get('enable_gpu', True) else '',
                'ENABLE_STEAM': 'true'
            }
            
            # Port mappings
            ports = {
                f'{novnc_port}/tcp': novnc_port,
                f'{sunshine_port}/tcp': sunshine_port,
                f'{sunshine_port}/udp': sunshine_port,
                # Additional Sunshine ports
                f'{sunshine_port+1}/tcp': sunshine_port+1,
                f'{sunshine_port+2}/udp': sunshine_port+2
            }
            
            # Device mappings
            devices = [
                '/dev/fuse:/dev/fuse',
                '/dev/uinput:/dev/uinput'
            ]
            
            if config.get('enable_gpu', True):
                devices.extend([
                    '/dev/dri:/dev/dri'
                ])
            
            # Create and start container
            container = docker_client.containers.run(
                DOCKER_IMAGE,
                detach=True,
                name=f"gaming_{instance_id}",
                environment=environment,
                ports=ports,
                devices=devices,
                cap_add=['NET_ADMIN', 'SYS_ADMIN', 'SYS_NICE'],
                security_opt=['seccomp:unconfined', 'apparmor:unconfined'],
                shm_size='2G',
                mem_limit=config.get('memory_limit', '4G'),
                cpu_count=int(config.get('cpu_limit', '2')),
                volumes={
                    home_volume: {'bind': '/home/default', 'mode': 'rw'},
                    games_volume: {'bind': '/mnt/games', 'mode': 'rw'}
                },
                restart_policy={'Name': 'unless-stopped'},
                hostname=f'gaming-{instance_id[:8]}',
                extra_hosts={f'gaming-{instance_id[:8]}': '127.0.0.1'}
            )
            
            return container
            
        except Exception as e:
            logger.error(f"Error creating container: {str(e)}")
            return None
    
    def get_instance(self, instance_id):
        """Get instance details"""
        conn = sqlite3.connect('instances.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM instances WHERE id = ?', (instance_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'id': row[0],
                'user_id': row[1],
                'container_id': row[2],
                'novnc_port': row[3],
                'sunshine_port': row[4],
                'display_number': row[5],
                'status': row[6],
                'created_at': row[7],
                'last_accessed': row[8],
                'config': json.loads(row[9]) if row[9] else {}
            }
        return None
    
    def list_instances(self, user_id=None):
        """List all instances or instances for a specific user"""
        conn = sqlite3.connect('instances.db')
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute('SELECT * FROM instances WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
        else:
            cursor.execute('SELECT * FROM instances ORDER BY created_at DESC')
        
        rows = cursor.fetchall()
        conn.close()
        
        instances = []
        for row in rows:
            instances.append({
                'id': row[0],
                'user_id': row[1],
                'container_id': row[2],
                'novnc_port': row[3],
                'sunshine_port': row[4],
                'display_number': row[5],
                'status': row[6],
                'created_at': row[7],
                'last_accessed': row[8],
                'config': json.loads(row[9]) if row[9] else {}
            })
        
        return instances
    
    def delete_instance(self, instance_id):
        """Delete an instance and clean up resources"""
        try:
            instance = self.get_instance(instance_id)
            if not instance:
                return False, "Instance not found"
            
            # Stop and remove container
            try:
                container = docker_client.containers.get(instance['container_id'])
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                pass
            
            # Release ports and display
            self.port_allocator.release_port(instance['novnc_port'])
            self.port_allocator.release_sunshine_ports(instance['sunshine_port'])
            self.display_allocator.release_display(instance['display_number'])
            
            # Remove from database
            conn = sqlite3.connect('instances.db')
            cursor = conn.cursor()
            cursor.execute('DELETE FROM instances WHERE id = ?', (instance_id,))
            conn.commit()
            conn.close()
            
            logger.info(f"Deleted instance {instance_id}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error deleting instance: {str(e)}")
            return False, str(e)

class PortAllocator:
    def __init__(self):
        self.allocated_ports = set()
        self.lock = threading.Lock()
    
    def allocate_port(self):
        """Allocate the next available port"""
        with self.lock:
            for port in range(BASE_PORT, BASE_PORT + (MAX_INSTANCES * 5)):  # Increased range for multiple ports per instance
                if port not in self.allocated_ports:
                    self.allocated_ports.add(port)
                    return port
            return None
    
    def allocate_sunshine_ports(self):
        """Allocate 3 consecutive ports for Sunshine (HTTP, HTTPS, RTSP)"""
        with self.lock:
            for port in range(BASE_PORT, BASE_PORT + (MAX_INSTANCES * 5) - 2):
                if (port not in self.allocated_ports and 
                    port + 1 not in self.allocated_ports and 
                    port + 2 not in self.allocated_ports):
                    self.allocated_ports.add(port)
                    self.allocated_ports.add(port + 1)
                    self.allocated_ports.add(port + 2)
                    return [port, port + 1, port + 2]
            return None
    
    def release_port(self, port):
        """Release a port back to the pool"""
        with self.lock:
            self.allocated_ports.discard(port)
    
    def release_sunshine_ports(self, base_port):
        """Release the 3 Sunshine ports"""
        with self.lock:
            self.allocated_ports.discard(base_port)
            self.allocated_ports.discard(base_port + 1)
            self.allocated_ports.discard(base_port + 2)

class DisplayAllocator:
    def __init__(self):
        self.allocated_displays = set()
        self.lock = threading.Lock()
    
    def allocate_display(self):
        """Allocate the next available display number"""
        with self.lock:
            for display in range(55, 55 + MAX_INSTANCES):
                if display not in self.allocated_displays:
                    self.allocated_displays.add(display)
                    return display
            return None
    
    def release_display(self, display):
        """Release a display back to the pool"""
        with self.lock:
            self.allocated_displays.discard(display)

# Initialize instance manager
instance_manager = InstanceManager()

@app.route('/')
def index():
    """Main dashboard"""
    return render_template('index.html')

@app.route('/instances')
def instances():
    """List all instances"""
    user_id = request.args.get('user_id', 'default')
    instances = instance_manager.list_instances(user_id)
    return render_template('instances.html', instances=instances, user_id=user_id)

@app.route('/create', methods=['GET', 'POST'])
def create_instance():
    """Create a new instance"""
    if request.method == 'POST':
        user_id = request.form.get('user_id', 'default')
        config = {
            'memory_limit': request.form.get('memory_limit', '4G'),
            'cpu_limit': request.form.get('cpu_limit', '2'),
            'enable_gpu': request.form.get('enable_gpu') == 'on',
            'enable_audio': request.form.get('enable_audio') == 'on',
            'user_password': request.form.get('user_password', 'gaming123')
        }
        
        instance_id, error = instance_manager.create_instance(user_id, config)
        
        if error:
            return render_template('create.html', error=error)
        
        return redirect(url_for('instance_detail', instance_id=instance_id))
    
    return render_template('create.html')

@app.route('/instance/<instance_id>')
def instance_detail(instance_id):
    """Show instance details"""
    instance = instance_manager.get_instance(instance_id)
    if not instance:
        return "Instance not found", 404
    
    # Update last accessed time
    conn = sqlite3.connect('instances.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE instances SET last_accessed = ? WHERE id = ?', 
                   (datetime.now(), instance_id))
    conn.commit()
    conn.close()
    
    return render_template('instance_detail.html', instance=instance)

@app.route('/api/instances', methods=['GET'])
def api_list_instances():
    """API endpoint to list instances"""
    user_id = request.args.get('user_id')
    instances = instance_manager.list_instances(user_id)
    return jsonify(instances)

@app.route('/api/instances', methods=['POST'])
def api_create_instance():
    """API endpoint to create instance"""
    data = request.get_json()
    user_id = data.get('user_id', 'default')
    config = data.get('config', {})
    
    instance_id, error = instance_manager.create_instance(user_id, config)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({'instance_id': instance_id})

@app.route('/api/instances/<instance_id>', methods=['DELETE'])
def api_delete_instance(instance_id):
    """API endpoint to delete instance"""
    success, error = instance_manager.delete_instance(instance_id)
    
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({'success': True})

@app.route('/delete/<instance_id>', methods=['POST'])
def delete_instance(instance_id):
    """Delete an instance"""
    success, error = instance_manager.delete_instance(instance_id)
    
    if error:
        return f"Error: {error}", 400
    
    return redirect(url_for('instances'))

if __name__ == '__main__':
    port = int(os.environ.get('PLATFORM_PORT', 15000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug) 