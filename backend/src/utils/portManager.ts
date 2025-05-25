import { prisma } from '../lib/prisma.js';

// Port ranges for different services
const PORT_RANGES = {
  VNC: { start: 8000, end: 8999 },           // VNC ports: 8000-8999
  SUNSHINE: { start: 9000, end: 9999 },      // Sunshine ports: 9000-9999
  MOONLIGHT: { start: 10000, end: 19999 }    // Moonlight ports: 10000-19999 (each user gets 12 consecutive ports)
};

const MOONLIGHT_PORTS_PER_USER = 12; // Each user needs 12 consecutive ports for Moonlight

/**
 * Get all currently allocated ports from the database
 */
async function getAllocatedPorts(): Promise<{
  vncPorts: number[];
  sunshinePorts: number[];
  moonlightPortRanges: Array<{ start: number; end: number }>;
}> {
  const instances = await prisma.instance.findMany({
    where: {
      status: { in: ['starting', 'running'] },
      OR: [
        { vncPort: { not: null } },
        { sunshinePort: { not: null } },
        { moonlightPortStart: { not: null } }
      ]
    },
    select: {
      vncPort: true,
      sunshinePort: true,
      moonlightPortStart: true
    }
  });

  const vncPorts: number[] = [];
  const sunshinePorts: number[] = [];
  const moonlightPortRanges: Array<{ start: number; end: number }> = [];

  instances.forEach((instance: { vncPort: number | null; sunshinePort: number | null; moonlightPortStart: number | null }) => {
    if (instance.vncPort) vncPorts.push(instance.vncPort);
    if (instance.sunshinePort) sunshinePorts.push(instance.sunshinePort);
    if (instance.moonlightPortStart) {
      moonlightPortRanges.push({
        start: instance.moonlightPortStart,
        end: instance.moonlightPortStart + MOONLIGHT_PORTS_PER_USER - 1
      });
    }
  });

  return { vncPorts, sunshinePorts, moonlightPortRanges };
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
    return null; // No available ports
  }
  
  return {
    vncPort,
    sunshinePort,
    moonlightPortStart
  };
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