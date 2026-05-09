import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  const alpha = 'cmokbpu9t0000d23lskpbtmv6';
  const beta = 'cmokbpuae0001d23loe9uc1f6';

  const seedUsers = [
    { email: 'superadmin@bugfix.local', name: 'Super Admin', role: 'SUPERADMIN' as const, teamId: null, password: 'SuperAdmin123', managerId: null },
    { email: 'lead.alpha@bugfix.local', name: 'Alice Lead', role: 'TEAMLEAD' as const, teamId: alpha, password: 'Lead12345', managerId: null },
    { email: 'lead.beta@bugfix.local', name: 'Bob Lead', role: 'TEAMLEAD' as const, teamId: beta, password: 'Lead12345', managerId: null },
    { email: 'dev1@bugfix.local', name: 'Dev One', role: 'DEVELOPER' as const, teamId: alpha, password: 'Dev12345', managerId: null },
    { email: 'dev2@bugfix.local', name: 'Dev Two', role: 'DEVELOPER' as const, teamId: beta, password: 'Dev12345', managerId: null },
    { email: 'tester1@bugfix.local', name: 'Tester One', role: 'TESTER' as const, teamId: alpha, password: 'Test1234', managerId: null },
    { email: 'tester2@bugfix.local', name: 'Tester Two', role: 'TESTER' as const, teamId: beta, password: 'Test1234', managerId: null },
  ];

  const created: Record<string, string> = {};

  for (const u of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: u.role, teamId: u.teamId, name: u.name } });
      console.log('Updated:', u.email, '->', u.role);
    } else {
      await prisma.user.create({
        data: { email: u.email, name: u.name, role: u.role, teamId: u.teamId, passwordHash: await hashPassword(u.password) },
      });
      console.log('Created:', u.email, '->', u.role);
    }
    created[u.email] = u.password;
  }

  // Set manager chain
  const superadmin = await prisma.user.findUnique({ where: { email: 'superadmin@bugfix.local' } });
  const leadAlpha = await prisma.user.findUnique({ where: { email: 'lead.alpha@bugfix.local' } });
  const leadBeta = await prisma.user.findUnique({ where: { email: 'lead.beta@bugfix.local' } });
  const dev1 = await prisma.user.findUnique({ where: { email: 'dev1@bugfix.local' } });
  const dev2 = await prisma.user.findUnique({ where: { email: 'dev2@bugfix.local' } });
  const tester1 = await prisma.user.findUnique({ where: { email: 'tester1@bugfix.local' } });
  const tester2 = await prisma.user.findUnique({ where: { email: 'tester2@bugfix.local' } });

  if (leadAlpha && superadmin) await prisma.user.update({ where: { id: leadAlpha.id }, data: { directManagerId: superadmin.id } });
  if (leadBeta && superadmin) await prisma.user.update({ where: { id: leadBeta.id }, data: { directManagerId: superadmin.id } });
  if (dev1 && leadAlpha) await prisma.user.update({ where: { id: dev1.id }, data: { directManagerId: leadAlpha.id } });
  if (dev2 && leadBeta) await prisma.user.update({ where: { id: dev2.id }, data: { directManagerId: leadBeta.id } });
  if (tester1 && leadAlpha) await prisma.user.update({ where: { id: tester1.id }, data: { directManagerId: leadAlpha.id } });
  if (tester2 && leadBeta) await prisma.user.update({ where: { id: tester2.id }, data: { directManagerId: leadBeta.id } });

  console.log('\nSeeded credentials:');
  for (const u of seedUsers) {
    console.log(`${u.role.padEnd(12)} ${u.email.padEnd(30)} ${u.password}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
