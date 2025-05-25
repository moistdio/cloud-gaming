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
  try {
    console.log('Starting cleanup of invalid port allocations...');
    
    // First check if the port fields exist in the database
    try {
      await prisma.$queryRaw`SELECT vncPort, sunshinePort, moonlightPortStart FROM "Instance" LIMIT 1`;
    } catch (schemaError) {
      console.log('Port fields do not exist in database schema yet, skipping cleanup');
      return;
    }
    
    // Find instances with ports outside our valid ranges
    const invalidInstances = await prisma.instance.findMany({
      where: {
        OR: [
          {
            vncPort: {
              OR: [
                { lt: PORT_RANGES.VNC.start },
                { gt: PORT_RANGES.VNC.end }
              ]
            }
          },
          {
            sunshinePort: {
              OR: [
                { lt: PORT_RANGES.SUNSHINE.start },
                { gt: PORT_RANGES.SUNSHINE.end }
              ]
            }
          },
          {
            moonlightPortStart: {
              OR: [
                { lt: PORT_RANGES.MOONLIGHT.start },
                { gt: PORT_RANGES.MOONLIGHT.end - MOONLIGHT_PORTS_PER_USER }
              ]
            }
          }
        ]
      }
    });

    console.log(`Found ${invalidInstances.length} instances with invalid port allocations`);

    // Reset port allocations for invalid instances
    for (const instance of invalidInstances) {
      try {
        await prisma.instance.update({
          where: { id: instance.id },
          data: {
            vncPort: null,
            sunshinePort: null,
            moonlightPortStart: null,
            status: 'stopped'
          }
        });
        console.log(`Reset port allocation for instance ${instance.id}`);
      } catch (updateError) {
        console.error(`Failed to reset instance ${instance.id}:`, updateError);
        // Continue with other instances even if one fails
      }
    }
    
    console.log('Cleanup of invalid port allocations completed');
  } catch (error) {
    console.error('Error during cleanup of invalid port allocations:', error);
    // Don't throw the error to prevent startup failure
  }
}

/**
 * Get all currently allocated ports from the database
 */
async function getAllocatedPorts(): Promise<{
  vncPorts: number[];
  sunshinePorts: number[];
  moonlightPortRanges: Array<{ start: number; end: number }>;
}> {
  try {
    // First clean up any invalid allocations
    await cleanupInvalidPortAllocations();

    // Check if port fields exist in the database
    try {
      await prisma.$queryRaw`SELECT vncPort, sunshinePort, moonlightPortStart FROM "Instance" LIMIT 1`;
    } catch (schemaError) {
      console.log('Port fields do not exist in database schema yet, returning empty port allocations');
      return { vncPorts: [], sunshinePorts: [], moonlightPortRanges: [] };
    }

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
  } catch (error) {
    console.error('Error getting allocated ports:', error);
    // Return empty arrays as fallback
    return { vncPorts: [], sunshinePorts: [], moonlightPortRanges: [] };
  }
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