import { prisma } from './lib/prisma.js';

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Try to query the Instance table to see if the new fields exist
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Instance' 
      AND table_schema = 'public'
      ORDER BY column_name;
    `;
    
    console.log('Instance table columns:', result);
    
    // Try to select from Instance table with new fields
    const instances = await prisma.instance.findMany({
      select: {
        id: true,
        userId: true,
        status: true,
        vncPort: true,
        sunshinePort: true,
        moonlightPortStart: true
      },
      take: 1
    });
    
    console.log('Schema check successful. Sample instance:', instances[0] || 'No instances found');
    
  } catch (error) {
    console.error('Schema check failed:', error);
    
    if (error instanceof Error && error.message.includes('column')) {
      console.log('It looks like the database schema needs to be updated.');
      console.log('Please run: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema(); 