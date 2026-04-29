import { PrismaClient, Severity, BugStatus, Priority } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function findOrCreate(
  email: string,
  name: string,
  role: 'SUPERADMIN' | 'TEAMLEAD' | 'DEVELOPER' | 'TESTER',
  password: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: { email, name, role, passwordHash: await hashPassword(password) },
  });
}

async function main() {
  // Create teams first
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

  // Create users with new roles
  const superadmin = await findOrCreate('admin@bugfix.local', 'Alice Admin', 'SUPERADMIN', 'Admin1234');
  const lead1 = await findOrCreate('lead1@bugfix.local', 'Bob Lead', 'TEAMLEAD', 'Lead12345');
  const lead2 = await findOrCreate('lead2@bugfix.local', 'Carol Lead', 'TEAMLEAD', 'Lead12345');
  const dev1 = await findOrCreate('dev1@bugfix.local', 'Dev One', 'DEVELOPER', 'Dev12345');
  const dev2 = await findOrCreate('dev2@bugfix.local', 'Dev Two', 'DEVELOPER', 'Dev12345');
  const dev3 = await findOrCreate('dev3@bugfix.local', 'Dev Three', 'DEVELOPER', 'Dev12345');
  const tester1 = await findOrCreate('tester1@bugfix.local', 'Tester One', 'TESTER', 'Test1234');
  const tester2 = await findOrCreate('tester2@bugfix.local', 'Tester Two', 'TESTER', 'Test1234');

  // Assign team membership
  await prisma.user.update({ where: { id: superadmin.id }, data: { teamId: null } });
  await prisma.user.update({ where: { id: lead1.id }, data: { teamId: alpha.id } });
  await prisma.user.update({ where: { id: lead2.id }, data: { teamId: beta.id } });
  await prisma.user.update({ where: { id: dev1.id }, data: { teamId: alpha.id } });
  await prisma.user.update({ where: { id: dev2.id }, data: { teamId: alpha.id } });
  await prisma.user.update({ where: { id: dev3.id }, data: { teamId: beta.id } });
  await prisma.user.update({ where: { id: tester1.id }, data: { teamId: alpha.id } });
  await prisma.user.update({ where: { id: tester2.id }, data: { teamId: beta.id } });

  // Set up manager chain: leads report to superadmin, devs/testers report to their lead
  await prisma.user.update({ where: { id: lead1.id }, data: { directManagerId: superadmin.id } });
  await prisma.user.update({ where: { id: lead2.id }, data: { directManagerId: superadmin.id } });
  await prisma.user.update({ where: { id: dev1.id }, data: { directManagerId: lead1.id } });
  await prisma.user.update({ where: { id: dev2.id }, data: { directManagerId: lead1.id } });
  await prisma.user.update({ where: { id: dev3.id }, data: { directManagerId: lead2.id } });
  await prisma.user.update({ where: { id: tester1.id }, data: { directManagerId: lead1.id } });
  await prisma.user.update({ where: { id: tester2.id }, data: { directManagerId: lead2.id } });

  if ((await prisma.bug.count()) > 0) {
    console.log('seed: bugs already exist, skipping bug seed');
    return;
  }

  const fixtures: Array<{
    title: string;
    severity: Severity;
    status: BugStatus;
    priority?: Priority;
    assignee?: string;
    daysAgo: number;
    teamId: string;
  }> = [
    { title: 'Login button stuck on Chrome 121', severity: 'CRITICAL', status: 'NEW', daysAgo: 0, teamId: alpha.id },
    { title: 'Sign-up form validates email twice', severity: 'LOW', status: 'NEW', daysAgo: 0, teamId: alpha.id },
    { title: 'Profile picture distorts on mobile', severity: 'MEDIUM', status: 'ASSIGNED', priority: 'P3', assignee: dev1.id, daysAgo: 1, teamId: alpha.id },
    { title: 'Search returns 0 results for valid query', severity: 'HIGH', status: 'IN_PROGRESS', priority: 'P2', assignee: dev1.id, daysAgo: 2, teamId: alpha.id },
    { title: 'Dashboard chart legend overlaps', severity: 'LOW', status: 'IN_PROGRESS', priority: 'P4', assignee: dev2.id, daysAgo: 1, teamId: alpha.id },
    { title: 'Password reset email never arrives', severity: 'CRITICAL', status: 'FIXED', priority: 'P1', assignee: dev3.id, daysAgo: 3, teamId: beta.id },
    { title: 'Comments break with markdown special chars', severity: 'MEDIUM', status: 'FIXED', priority: 'P3', assignee: dev1.id, daysAgo: 4, teamId: alpha.id },
    { title: 'Drag-and-drop attachment fails on Safari', severity: 'HIGH', status: 'VERIFIED', priority: 'P2', assignee: dev3.id, daysAgo: 5, teamId: beta.id },
    { title: 'Old session not cleared after logout', severity: 'CRITICAL', status: 'CLOSED', priority: 'P1', assignee: dev1.id, daysAgo: 10, teamId: alpha.id },
    { title: 'Localized date format wrong in Mexico', severity: 'LOW', status: 'CLOSED', priority: 'P4', assignee: dev3.id, daysAgo: 8, teamId: beta.id },
    { title: 'Invoice PDF download corrupts', severity: 'HIGH', status: 'CLOSED', priority: 'P2', assignee: dev1.id, daysAgo: 12, teamId: alpha.id },
    { title: 'Tooltip clipped at viewport edge', severity: 'LOW', status: 'NEW', daysAgo: 0, teamId: beta.id },
  ];

  for (const f of fixtures) {
    const created = new Date(Date.now() - f.daysAgo * 86400 * 1000);
    const closedAt = f.status === 'CLOSED' ? new Date(created.getTime() + 6 * 60 * 60 * 1000) : null;
    const reporter = Math.random() > 0.5 ? tester1 : tester2;
    await prisma.bug.create({
      data: {
        title: f.title,
        description: 'Reproducible on staging.',
        stepsToReproduce: '1. Open the page\n2. Trigger the action\n3. Observe the issue',
        severity: f.severity,
        priority: f.priority ?? null,
        status: f.status,
        reporterId: reporter.id,
        assigneeId: f.assignee ?? null,
        teamId: f.teamId,
        createdAt: created,
        closedAt,
        screenshots: [],
      },
    });
  }

  const firstBug = await prisma.bug.findFirst({ where: { status: 'NEW' } });
  if (firstBug) {
    await prisma.comment.create({
      data: { bugId: firstBug.id, authorId: dev1.id, text: 'Reproduced on Chrome 121, looking now.' },
    });
    await prisma.comment.create({
      data: { bugId: firstBug.id, authorId: tester1.id, text: 'Thanks — happens on staging too.' },
    });
  }

  console.log('seed: created teams and', fixtures.length, 'bugs with team scoping');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
