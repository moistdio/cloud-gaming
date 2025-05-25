#!/usr/bin/env node

// Test script for port allocation
// This script simulates multiple users creating containers to test port allocation

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Test users (you'll need to create these users first)
const testUsers = [
  { username: 'testuser1', password: 'password123' },
  { username: 'testuser2', password: 'password123' },
  { username: 'testuser3', password: 'password123' }
];

async function loginUser(username, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${username}:`, error.response?.data || error.message);
    return null;
  }
}

async function createContainer(token, containerName) {
  try {
    const response = await axios.post(`${BASE_URL}/containers/create`, {
      containerName
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Container creation failed:`, error.response?.data || error.message);
    return null;
  }
}

async function getPortStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/containers/ports`);
    return response.data;
  } catch (error) {
    console.error('Failed to get port status:', error.response?.data || error.message);
    return null;
  }
}

async function cleanup() {
  try {
    const response = await axios.post(`${BASE_URL}/containers/cleanup`);
    console.log('Cleanup result:', response.data);
  } catch (error) {
    console.error('Cleanup failed:', error.response?.data || error.message);
  }
}

async function runTest() {
  console.log('🧪 Testing Port Allocation System');
  console.log('================================');
  
  // First, cleanup any orphaned containers
  console.log('\n1. Running cleanup...');
  await cleanup();
  
  // Show initial port status
  console.log('\n2. Initial port status:');
  let portStatus = await getPortStatus();
  if (portStatus) {
    console.log(`   Total containers: ${portStatus.summary.total}`);
    console.log(`   Running containers: ${portStatus.summary.running}`);
    console.log(`   Orphaned containers: ${portStatus.summary.orphaned}`);
  }
  
  // Test container creation for multiple users
  console.log('\n3. Creating containers for test users...');
  
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`\n   Testing user: ${user.username}`);
    
    // Login
    const token = await loginUser(user.username, user.password);
    if (!token) {
      console.log(`   ❌ Login failed for ${user.username}`);
      continue;
    }
    console.log(`   ✅ Login successful`);
    
    // Create container
    const container = await createContainer(token, `Test Container ${i + 1}`);
    if (container) {
      console.log(`   ✅ Container created:`);
      console.log(`      VNC Port: ${container.container.vncPort}`);
      console.log(`      Web Port: ${container.container.webVncPort}`);
    } else {
      console.log(`   ❌ Container creation failed`);
    }
    
    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Show final port status
  console.log('\n4. Final port status:');
  portStatus = await getPortStatus();
  if (portStatus) {
    console.log(`   Port ranges: VNC ${portStatus.portRanges.vnc}, Web ${portStatus.portRanges.web}`);
    console.log(`   Total containers: ${portStatus.summary.total}`);
    console.log(`   Running containers: ${portStatus.summary.running}`);
    console.log(`   Orphaned containers: ${portStatus.summary.orphaned}`);
    
    if (portStatus.containers.length > 0) {
      console.log('\n   Container details:');
      portStatus.containers.forEach(container => {
        console.log(`   - User ${container.userId}: VNC ${container.vncPort}, Web ${container.webPort} (${container.dockerStatus})`);
      });
    }
  }
  
  console.log('\n🎉 Test completed!');
  console.log('\nTo clean up test containers, run:');
  console.log('curl -X POST http://localhost:3002/api/containers/cleanup');
}

// Run the test
runTest().catch(console.error); 