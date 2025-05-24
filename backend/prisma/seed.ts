import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
      inviteCodes: {
        create: {
          code: 'ADMIN2024',
          isUsed: false,
          createdById: 'admin' // Will be replaced with actual ID
        }
      }
    }
  });

  // Update the invite code with the correct admin ID
  await prisma.invite.updateMany({
    where: { createdById: 'admin' },
    data: { createdById: admin.id }
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