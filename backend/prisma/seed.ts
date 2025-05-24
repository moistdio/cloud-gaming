import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin account
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cloudgaming.com' },
    update: {},
    create: {
      email: 'admin@cloudgaming.com',
      password: hashedPassword,
      role: 'ADMIN',
      // Create an invite code for the admin
      inviteCodes: {
        create: {
          code: 'ADMIN2024',
          isUsed: false
        }
      }
    }
  });

  console.log('Seeded default admin account:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 