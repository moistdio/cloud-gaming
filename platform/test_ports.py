#!/usr/bin/env python3
"""
Test script to verify port allocation and forwarding for the cloud gaming platform.
"""

import socket
import sys
import time
from app import InstanceManager

def test_port_connectivity(host, port, timeout=5):
    """Test if a port is accessible"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        print(f"Error testing port {port}: {e}")
        return False

def test_port_allocation():
    """Test the port allocation system"""
    print("Testing port allocation system...")
    
    # Initialize instance manager
    manager = InstanceManager()
    
    # Test noVNC port allocation
    print("\n1. Testing noVNC port allocation:")
    novnc_port = manager.port_allocator.allocate_port()
    print(f"   Allocated noVNC port: {novnc_port}")
    
    # Test Sunshine port allocation
    print("\n2. Testing Sunshine port allocation:")
    sunshine_ports = manager.port_allocator.allocate_sunshine_ports()
    if sunshine_ports:
        print(f"   Allocated Sunshine ports: {sunshine_ports}")
        print(f"   HTTPS: {sunshine_ports[0]}")
        print(f"   HTTP:  {sunshine_ports[1]}")
        print(f"   RTSP:  {sunshine_ports[2]}")
    else:
        print("   Failed to allocate Sunshine ports!")
        return False
    
    # Test display allocation
    print("\n3. Testing display allocation:")
    display = manager.display_allocator.allocate_display()
    print(f"   Allocated display: :{display}")
    
    # Clean up
    manager.port_allocator.release_port(novnc_port)
    manager.port_allocator.release_sunshine_ports(sunshine_ports[0])
    manager.display_allocator.release_display(display)
    
    print("\n✅ Port allocation test completed successfully!")
    return True

def test_instance_creation():
    """Test creating a gaming instance"""
    print("\nTesting instance creation...")
    
    manager = InstanceManager()
    
    # Create test instance
    config = {
        'memory_limit': '2G',
        'cpu_limit': '1',
        'enable_gpu': False,  # Disable GPU for testing
        'enable_audio': True,
        'user_password': 'test123'
    }
    
    print("Creating test instance...")
    instance_id, error = manager.create_instance('test_user', config)
    
    if error:
        print(f"❌ Failed to create instance: {error}")
        return False
    
    print(f"✅ Instance created successfully: {instance_id}")
    
    # Get instance details
    instance = manager.get_instance(instance_id)
    if instance:
        print(f"   noVNC port: {instance['novnc_port']}")
        print(f"   Sunshine ports: {instance['sunshine_port']}-{instance['sunshine_port']+2}")
        print(f"   Display: :{instance['display_number']}")
        
        # Wait a moment for container to start
        print("Waiting for container to start...")
        time.sleep(10)
        
        # Test port connectivity
        print("\nTesting port connectivity:")
        novnc_accessible = test_port_connectivity('localhost', instance['novnc_port'])
        sunshine_accessible = test_port_connectivity('localhost', instance['sunshine_port'])
        
        print(f"   noVNC (port {instance['novnc_port']}): {'✅ Accessible' if novnc_accessible else '❌ Not accessible'}")
        print(f"   Sunshine (port {instance['sunshine_port']}): {'✅ Accessible' if sunshine_accessible else '❌ Not accessible'}")
        
        # Clean up
        print("\nCleaning up test instance...")
        success, error = manager.delete_instance(instance_id)
        if success:
            print("✅ Test instance deleted successfully!")
        else:
            print(f"❌ Failed to delete test instance: {error}")
        
        return novnc_accessible or sunshine_accessible  # At least one should be accessible
    else:
        print("❌ Failed to retrieve instance details")
        return False

def main():
    """Main test function"""
    print("🎮 Cloud Gaming Platform - Port Forwarding Test")
    print("=" * 50)
    
    try:
        # Test 1: Port allocation
        if not test_port_allocation():
            print("❌ Port allocation test failed!")
            sys.exit(1)
        
        # Test 2: Instance creation (optional, requires Docker)
        print("\n" + "=" * 50)
        response = input("Do you want to test instance creation? This requires Docker. (y/N): ")
        if response.lower() in ['y', 'yes']:
            if not test_instance_creation():
                print("❌ Instance creation test failed!")
                sys.exit(1)
        else:
            print("Skipping instance creation test.")
        
        print("\n🎉 All tests completed successfully!")
        print("\nPort forwarding configuration:")
        print("- noVNC ports: Every 5th port starting from 12000 (12000, 12005, 12010...)")
        print("- Sunshine ports: 3 consecutive ports (12001-12003, 12006-12008, 12011-12013...)")
        print("- Each instance uses 4 ports total (1 noVNC + 3 Sunshine)")
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 