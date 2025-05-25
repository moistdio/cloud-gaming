import { prisma } from '../lib/prisma.js';

// Port ranges for different services
const PORT_RANGES = {
  VNC: { start: 7000, end: 7500 },           // VNC ports: 7000-7500
  SUNSHINE: { start: 7501, end: 8000 },      // Sunshine ports: 7501-8000
  MOONLIGHT: { start: 10000, end: 19999 }    // Moonlight ports: 10000-19999 (each user gets 12 consecutive ports)
};

const MOONLIGHT_PORTS_PER_USER = 12; // Each user needs 12 consecutive ports for Moonlight

/**
 * Clean up instances with invalid port allocations
 */
export async function cleanupInvalidPortAllocations(): Promise<void> {
  // Temporarily disabled to prevent startup issues
  console.log('Port cleanup temporarily disabled until schema is updated');
  return;
}

/**
 * Get all currently allocated ports from the database
 */
async function getAllocatedPorts(): Promise<{
  vncPorts: number[];
  sunshinePorts: number[];
  moonlightPortRanges: Array<{ start: number; end: number }>;
}> {
  // Temporarily return empty arrays until schema is updated
  console.log('Port allocation temporarily using fallback until schema is updated');
  return { vncPorts: [], sunshinePorts: [], moonlightPortRanges: [] };
}

/**
 * Find the next available port in a given range
 */
function findAvailablePort(start: number, end: number, usedPorts: number[]): number | null {
  for (let port = start; port <= end; port++) {
    if (!usedPorts.includes(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Find available consecutive ports for Moonlight
 */
function findAvailableMoonlightPortRange(
  usedRanges: Array<{ start: number; end: number }>
): number | null {
  const { start, end } = PORT_RANGES.MOONLIGHT;
  
  for (let portStart = start; portStart <= end - MOONLIGHT_PORTS_PER_USER + 1; portStart += MOONLIGHT_PORTS_PER_USER) {
    const portEnd = portStart + MOONLIGHT_PORTS_PER_USER - 1;
    
    // Check if this range conflicts with any used range
    const hasConflict = usedRanges.some(usedRange => 
      !(portEnd < usedRange.start || portStart > usedRange.end)
    );
    
    if (!hasConflict) {
      return portStart;
    }
  }
  
  return null;
}

/**
 * Allocate ports for a new instance
 */
export async function allocatePorts(): Promise<{
  vncPort: number;
  sunshinePort: number;
  moonlightPortStart: number;
} | null> {
  try {
    console.log('Starting port allocation...');
    const allocated = await getAllocatedPorts();
    
    // Find available VNC port
    const vncPort = findAvailablePort(
      PORT_RANGES.VNC.start,
      PORT_RANGES.VNC.end,
      allocated.vncPorts
    );
    
    // Find available Sunshine port
    const sunshinePort = findAvailablePort(
      PORT_RANGES.SUNSHINE.start,
      PORT_RANGES.SUNSHINE.end,
      allocated.sunshinePorts
    );
    
    // Find available Moonlight port range
    const moonlightPortStart = findAvailableMoonlightPortRange(allocated.moonlightPortRanges);
    
    if (!vncPort || !sunshinePort || !moonlightPortStart) {
      console.error('No available ports found', { vncPort, sunshinePort, moonlightPortStart });
      return null; // No available ports
    }
    
    console.log('Port allocation successful:', { vncPort, sunshinePort, moonlightPortStart });
    return {
      vncPort,
      sunshinePort,
      moonlightPortStart
    };
  } catch (error) {
    console.error('Error during port allocation:', error);
    return null;
  }
}

/**
 * Get Moonlight port mappings for a given starting port
 */
export function getMoonlightPortMappings(startPort: number): Array<{ host: number; container: number; protocol: 'tcp' | 'udp' }> {
  const mappings: Array<{ host: number; container: number; protocol: 'tcp' | 'udp' }> = [];
  const containerPorts = [47989, 47990, 47991, 47992, 47993, 47994, 47995, 47996, 47997, 47998, 47999, 48000];
  
  containerPorts.forEach((containerPort, index) => {
    const hostPort = startPort + index;
    mappings.push(
      { host: hostPort, container: containerPort, protocol: 'tcp' },
      { host: hostPort, container: containerPort, protocol: 'udp' }
    );
  });
  
  return mappings;
} 