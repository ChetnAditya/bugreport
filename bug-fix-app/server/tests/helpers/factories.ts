import { prisma } from '../../src/db';
import { hashPassword } from '../../src/lib/password';
import type { Role } from '@prisma/client';

export async function resetDb() {
  await prisma.comment.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.user.deleteMany();
}

export async function createBug(opts: {
  reporterId: string;
  assigneeId?: string;
  status?: import('@prisma/client').BugStatus;
  severity?: import('@prisma/client').Severity;
  priority?: import('@prisma/client').Priority;
  title?: string;
}) {
  return prisma.bug.create({
    data: {
      title: opts.title ?? 'Sample bug',
      description: 'Something is broken',
      stepsToReproduce: '1. Do X 2. See Y',
      severity: opts.severity ?? 'MEDIUM',
      priority: opts.priority ?? null,
      status: opts.status ?? 'NEW',
      reporterId: opts.reporterId,
      assigneeId: opts.assigneeId ?? null,
      screenshots: [],
    },
  });
}

export async function createUser(opts: {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
} = {}) {
  const email = opts.email ?? `u${Date.now()}${Math.random()}@example.com`;
  const password = opts.password ?? 'Passw0rd!';
  const user = await prisma.user.create({
    data: {
      email,
      name: opts.name ?? 'Test User',
      passwordHash: await hashPassword(password),
      role: opts.role ?? 'TESTER',
    },
  });
  return { user, password };
}

export async function createComment(opts: {
  bugId: string;
  authorId: string;
  text?: string;
}) {
  return prisma.comment.create({
    data: {
      bugId: opts.bugId,
      authorId: opts.authorId,
      text: opts.text ?? 'A comment',
    },
  });
}
