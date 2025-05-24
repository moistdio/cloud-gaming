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
      role: 'ADMIN'
    }
  });

  // Create invite code with the correct admin ID
  await prisma.invite.upsert({
    where: { code: 'ADMIN2024' },
    update: {},
    create: {
      code: 'ADMIN2024',
      isUsed: false,
      createdBy: {
        connect: { id: admin.id }
      }
    }
  });

  console.log('Seeded default admin account:', admin.email);
  console.log('Created default invite code: ADMIN2024');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 