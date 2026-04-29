import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@bugfix.local';
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (exists) {
    console.log('seed: admin already exists, skipping user seed');
    return;
  }
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: await hashPassword('Admin1234'),
      role: 'ADMIN',
    },
  });
  await prisma.user.create({
    data: {
      email: 'dev1@bugfix.local',
      name: 'Dev One',
      passwordHash: await hashPassword('Dev12345'),
      role: 'DEVELOPER',
    },
  });
  await prisma.user.create({
    data: {
      email: 'tester1@bugfix.local',
      name: 'Tester One',
      passwordHash: await hashPassword('Test1234'),
      role: 'TESTER',
    },
  });
  console.log('seed: created admin/dev/tester');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
