import { PrismaClient } from '../generated/prisma';
import { hashPassword } from '../src/lib/password';

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear bugs and comments first (foreign key constraints)
  await prisma.comment.deleteMany();
  await prisma.bug.deleteMany();

  // Clean messy users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'u17774849351180.05714661130689325@example.com',
          'd1@x.com',
          'd2@x.com',
          'r@x.com',
          'louis05022006@gmail.com',
        ],
      },
    },
  });
  console.log('Cleaned messy users');

  // Ensure teams
  const alpha = await prisma.team.upsert({
    where: { slug: 'alpha' },
    update: {},
    create: { name: 'Alpha Squad', slug: 'alpha', description: 'Frontend team' },
  });
  const beta = await prisma.team.upsert({
    where: { slug: 'beta' },
    update: {},
    create: { name: 'Beta Squad', slug: 'beta', description: 'Backend team' },
  });

  const seedList = [
    { email: 'superadmin@bugfix.local', name: 'Super Admin', role: 'SUPERADMIN' as const, teamId: null, password: 'SuperAdmin123' },
    { email: 'alice.lead@bugfix.local', name: 'Alice Lead', role: 'TEAMLEAD' as const, teamId: alpha.id, password: 'Lead12345' },
    { email: 'bob.lead@bugfix.local', name: 'Bob Lead', role: 'TEAMLEAD' as const, teamId: beta.id, password: 'Lead12345' },
    { email: 'carol.dev@bugfix.local', name: 'Carol Dev', role: 'DEVELOPER' as const, teamId: alpha.id, password: 'Dev12345' },
    { email: 'dave.dev@bugfix.local', name: 'Dave Dev', role: 'DEVELOPER' as const, teamId: beta.id, password: 'Dev12345' },
    { email: 'ellen.test@bugfix.local', name: 'Ellen Test', role: 'TESTER' as const, teamId: alpha.id, password: 'Test1234' },
    { email: 'fred.test@bugfix.local', name: 'Fred Test', role: 'TESTER' as const, teamId: beta.id, password: 'Test1234' },
  ];

  // Track by email, not by role (roles duplicate across teams)
  const byEmail: Record<string, { id: string; role: string; teamId: string | null }> = {};
  for (const u of seedList) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { name: u.name, role: u.role, teamId: u.teamId } });
      byEmail[u.email] = { id: existing.id, role: u.role, teamId: u.teamId };
      console.log('Updated:', u.email, '->', u.role);
    } else {
      const user = await prisma.user.create({
        data: { email: u.email, name: u.name, role: u.role, teamId: u.teamId, passwordHash: await hashPassword(u.password) },
      });
      byEmail[u.email] = { id: user.id, role: u.role, teamId: u.teamId };
      console.log('Created:', u.email, '->', u.role);
    }
  }

  const sa = byEmail['superadmin@bugfix.local']!;
  const aliceLead = byEmail['alice.lead@bugfix.local']!;
  const bobLead = byEmail['bob.lead@bugfix.local']!;
  const carolDev = byEmail['carol.dev@bugfix.local']!;
  const daveDev = byEmail['dave.dev@bugfix.local']!;
  const ellenTest = byEmail['ellen.test@bugfix.local']!;
  const fredTest = byEmail['fred.test@bugfix.local']!;

  // Set manager chain: leads → SA, devs/testers → their team lead
  await prisma.user.update({ where: { id: aliceLead.id }, data: { directManagerId: sa.id } });
  await prisma.user.update({ where: { id: bobLead.id }, data: { directManagerId: sa.id } });
  await prisma.user.update({ where: { id: carolDev.id }, data: { directManagerId: aliceLead.id } });
  await prisma.user.update({ where: { id: daveDev.id }, data: { directManagerId: bobLead.id } });
  await prisma.user.update({ where: { id: ellenTest.id }, data: { directManagerId: aliceLead.id } });
  await prisma.user.update({ where: { id: fredTest.id }, data: { directManagerId: bobLead.id } });
  console.log('Manager chain set');

  // Clear bugs and comments first (foreign key constraints)
  await prisma.comment.deleteMany();
  await prisma.bug.deleteMany();

  const devs = await prisma.user.findMany({ where: { role: 'DEVELOPER' }, select: { id: true, email: true, teamId: true } });
  const testers = await prisma.user.findMany({ where: { role: 'TESTER' }, select: { id: true, email: true, teamId: true } });

  const devAlpha = devs.find((d) => d.teamId === alpha.id)!;
  const devBeta = devs.find((d) => d.teamId === beta.id)!;
  const testAlpha = testers.find((t) => t.teamId === alpha.id)!;
  const testBeta = testers.find((t) => t.teamId === beta.id)!;

  const bugDefs = [
    // NEW bugs (2) — reporter only, no assignee
    { title: 'Login button frozen on Chrome 122', severity: 'CRITICAL' as const, status: 'NEW' as const, teamId: alpha.id, reporterId: testAlpha.id, assigneeId: null, priority: null },
    { title: 'Signup form validates email twice', severity: 'LOW' as const, status: 'NEW' as const, teamId: beta.id, reporterId: testBeta.id, assigneeId: null, priority: null },
    // ASSIGNED bugs (2) — lead assigned to a dev
    { title: 'Avatar distorted on retina screens', severity: 'MEDIUM' as const, status: 'ASSIGNED' as const, teamId: alpha.id, reporterId: testAlpha.id, assigneeId: devAlpha.id, priority: 'P3' as const },
    { title: 'Search returns empty results', severity: 'HIGH' as const, status: 'ASSIGNED' as const, teamId: beta.id, reporterId: testBeta.id, assigneeId: devBeta.id, priority: 'P2' as const },
    // IN_PROGRESS (2)
    { title: 'Dashboard chart overlaps title', severity: 'LOW' as const, status: 'IN_PROGRESS' as const, teamId: alpha.id, reporterId: testAlpha.id, assigneeId: devAlpha.id, priority: 'P4' as const },
    { title: 'Markdown chars break comments', severity: 'MEDIUM' as const, status: 'IN_PROGRESS' as const, teamId: beta.id, reporterId: testBeta.id, assigneeId: devBeta.id, priority: 'P3' as const },
    // FIXED (2) — dev marked fixed, tester needs to verify
    { title: 'Password reset email not arriving', severity: 'CRITICAL' as const, status: 'FIXED' as const, teamId: alpha.id, reporterId: testAlpha.id, assigneeId: devAlpha.id, priority: 'P1' as const },
    { title: 'Drag-and-drop fails on Safari', severity: 'HIGH' as const, status: 'FIXED' as const, teamId: beta.id, reporterId: testBeta.id, assigneeId: devBeta.id, priority: 'P2' as const },
    // VERIFIED (2) — tester verified, TEAMLEAD or SUPERADMIN can close
    { title: 'Tooltip clipped at viewport edge', severity: 'LOW' as const, status: 'VERIFIED' as const, teamId: alpha.id, reporterId: testAlpha.id, assigneeId: devAlpha.id, priority: 'P4' as const },
    { title: 'Invoice PDF download corrupts', severity: 'HIGH' as const, status: 'VERIFIED' as const, teamId: beta.id, reporterId: testBeta.id, assigneeId: devBeta.id, priority: 'P2' as const },
    // CLOSED (1)
    { title: 'Old session survives logout', severity: 'CRITICAL' as const, status: 'CLOSED' as const, teamId: alpha.id, reporterId: testAlpha.id, assigneeId: devAlpha.id, priority: 'P1' as const },
  ];

  for (const b of bugDefs) {
    await prisma.bug.create({
      data: {
        title: b.title,
        description: 'Reproducible on staging.',
        stepsToReproduce: '1. Open page\n2. Trigger action\n3. Observe bug',
        severity: b.severity,
        status: b.status,
        priority: b.priority ?? null,
        reporterId: b.reporterId,
        assigneeId: b.assigneeId,
        teamId: b.teamId,
        screenshots: [],
        closedAt: b.status === 'CLOSED' ? new Date() : null,
      },
    });
  }
  console.log(`Created ${bugDefs.length} bugs`);

  // Summary
  console.log('\n=== CLEAN TEST CREDENTIALS ===');
  console.log('| Role | Email | Password | Team | Reports to |');
  console.log('|------|-------|---------|------|-----------|');
  const pwds: Record<string, string> = { SUPERADMIN: 'SuperAdmin123', TEAMLEAD: 'Lead12345', DEVELOPER: 'Dev12345', TESTER: 'Test1234' };
  for (const u of seedList) {
    const full = await prisma.user.findUnique({
      where: { email: u.email },
      include: { team: true, directManager: { select: { name: true } } },
    });
    if (full) {
      console.log(u.role.padEnd(12), u.email.padEnd(28), pwds[u.role].padEnd(12), (full.team?.name || 'none').padEnd(10), full.directManager?.name || '—');
    }
  }

  console.log('\n=== BUGS BY STATUS ===');
  const byStatus = await prisma.bug.groupBy({ by: ['status'], _count: { _all: true } });
  byStatus.forEach((r) => console.log(r.status.padEnd(15), r._count._all));
}

main().catch(console.error).finally(() => prisma.$disconnect());
