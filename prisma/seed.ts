import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'anmolbongirwar@gmail.com' },
  });

  if (existingUser) {
    console.log('Admin user already exists. Skipping seed.');
    return;
  }

  // Create admin user with default password
  const passwordHash = await bcrypt.hash('1234', 10);

  const user = await prisma.user.create({
    data: {
      email: 'anmolbongirwar@gmail.com',
      passwordHash,
    },
  });

  console.log('Admin user created:', user.email);
  console.log('⚠️  WARNING: Default password is "1234" - CHANGE THIS IMMEDIATELY!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
