import { PrismaClient, Severity, BugStatus, Priority } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function findOrCreate(email: string, name: string, role: 'ADMIN' | 'DEVELOPER' | 'TESTER', password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: { email, name, role, passwordHash: await hashPassword(password) },
  });
}

async function main() {
  const admin = await findOrCreate('admin@bugfix.local', 'Admin', 'ADMIN', 'Admin1234');
  const dev1 = await findOrCreate('dev1@bugfix.local', 'Dev One', 'DEVELOPER', 'Dev12345');
  const dev2 = await findOrCreate('dev2@bugfix.local', 'Dev Two', 'DEVELOPER', 'Dev12345');
  const tester1 = await findOrCreate('tester1@bugfix.local', 'Tester One', 'TESTER', 'Test1234');
  const tester2 = await findOrCreate('tester2@bugfix.local', 'Tester Two', 'TESTER', 'Test1234');

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
  }> = [
    { title: 'Login button stuck on Chrome 121', severity: 'CRITICAL', status: 'NEW', daysAgo: 0 },
    { title: 'Sign-up form validates email twice', severity: 'LOW', status: 'NEW', daysAgo: 0 },
    { title: 'Profile picture distorts on mobile', severity: 'MEDIUM', status: 'ASSIGNED', priority: 'P3', assignee: dev1.id, daysAgo: 1 },
    { title: 'Search returns 0 results for valid query', severity: 'HIGH', status: 'IN_PROGRESS', priority: 'P2', assignee: dev1.id, daysAgo: 2 },
    { title: 'Dashboard chart legend overlaps', severity: 'LOW', status: 'IN_PROGRESS', priority: 'P4', assignee: dev2.id, daysAgo: 1 },
    { title: 'Password reset email never arrives', severity: 'CRITICAL', status: 'FIXED', priority: 'P1', assignee: dev2.id, daysAgo: 3 },
    { title: 'Comments break with markdown special chars', severity: 'MEDIUM', status: 'FIXED', priority: 'P3', assignee: dev1.id, daysAgo: 4 },
    { title: 'Drag-and-drop attachment fails on Safari', severity: 'HIGH', status: 'VERIFIED', priority: 'P2', assignee: dev2.id, daysAgo: 5 },
    { title: 'Old session not cleared after logout', severity: 'CRITICAL', status: 'CLOSED', priority: 'P1', assignee: dev1.id, daysAgo: 10 },
    { title: 'Localized date format wrong in Mexico', severity: 'LOW', status: 'CLOSED', priority: 'P4', assignee: dev2.id, daysAgo: 8 },
    { title: 'Invoice PDF download corrupts', severity: 'HIGH', status: 'CLOSED', priority: 'P2', assignee: dev1.id, daysAgo: 12 },
    { title: 'Tooltip clipped at viewport edge', severity: 'LOW', status: 'NEW', daysAgo: 0 },
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
        createdAt: created,
        closedAt,
        screenshots: [],
      },
    });
  }

  // a couple of comments on the first NEW bug for demo
  const firstBug = await prisma.bug.findFirst({ where: { status: 'NEW' } });
  if (firstBug) {
    await prisma.comment.create({
      data: { bugId: firstBug.id, authorId: dev1.id, text: 'Reproduced on Chrome 121, looking now.' },
    });
    await prisma.comment.create({
      data: { bugId: firstBug.id, authorId: tester1.id, text: 'Thanks — happens on staging too.' },
    });
  }

  console.log('seed: created', fixtures.length, 'bugs and 2 comments');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
