import { PrismaClient } from '../generated/prisma';

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const alpha = await prisma.team.upsert({
    where: { slug: 'alpha' },
    update: {},
    create: { name: 'Alpha Squad', slug: 'alpha', description: 'Frontend-focused team' },
  });
  const beta = await prisma.team.upsert({
    where: { slug: 'beta' },
    update: {},
    create: { name: 'Beta Squad', slug: 'beta', description: 'Backend/platform team' },
  });
  console.log('Teams:', alpha.name, beta.name);

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  console.log('Found', users.length, 'users');

  const superadmin = users[0];
  await prisma.user.update({ where: { id: superadmin.id }, data: { role: 'SUPERADMIN', teamId: null } });
  console.log('Superadmin:', superadmin.email);

  const rest = users.slice(1);
  const teamIds = [alpha.id, beta.id];
  for (let i = 0; i < rest.length; i++) {
    const u = rest[i];
    const teamId = teamIds[i % teamIds.length];
    const role = i < 2 ? 'TEAMLEAD' : i < 5 ? 'DEVELOPER' : 'TESTER';
    await prisma.user.update({ where: { id: u.id }, data: { teamId, role } });
    console.log('Updated', u.email, '->', role, 'team:', teamId === alpha.id ? 'alpha' : 'beta');
  }

  const leads = await prisma.user.findMany({ where: { role: 'TEAMLEAD' } });
  const devs = await prisma.user.findMany({ where: { role: 'DEVELOPER' } });
  const testers = await prisma.user.findMany({ where: { role: 'TESTER' } });

  for (const lead of leads) {
    await prisma.user.update({ where: { id: lead.id }, data: { directManagerId: superadmin.id } });
    console.log(lead.email, 'reports to', superadmin.email);
  }
  for (const dev of devs) {
    const lead = leads.find((l) => l.teamId === dev.teamId);
    if (lead) {
      await prisma.user.update({ where: { id: dev.id }, data: { directManagerId: lead.id } });
      console.log(dev.email, 'reports to', lead.email);
    }
  }
  for (const tester of testers) {
    const lead = leads.find((l) => l.teamId === tester.teamId);
    if (lead) {
      await prisma.user.update({ where: { id: tester.id }, data: { directManagerId: lead.id } });
      console.log(tester.email, 'reports to', lead.email);
    }
  }

  const bugs = await prisma.bug.findMany();
  for (const bug of bugs) {
    const teamId = teamIds[Math.floor(Math.random() * teamIds.length)];
    await prisma.bug.update({ where: { id: bug.id }, data: { teamId } });
  }
  console.log('Assigned teams to', bugs.length, 'bugs');
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
