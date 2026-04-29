import { prisma } from '../../db';
import { SEVERITY, STATUS, PRIORITY } from '../bugs/bugs.schema';
import type { BugStatus, Severity, Priority } from '@prisma/client';

function zeroes<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

export async function summary() {
  const [byStatusRows, bySeverityRows, byPriorityRows, total] = await Promise.all([
    prisma.bug.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.bug.groupBy({ by: ['severity'], _count: { _all: true } }),
    prisma.bug.groupBy({ by: ['priority'], _count: { _all: true } }),
    prisma.bug.count(),
  ]);

  const byStatus = zeroes(STATUS) as Record<BugStatus, number>;
  byStatusRows.forEach((r) => (byStatus[r.status] = r._count._all));

  const bySeverity = zeroes(SEVERITY) as Record<Severity, number>;
  bySeverityRows.forEach((r) => (bySeverity[r.severity] = r._count._all));

  const byPriority = zeroes(PRIORITY) as Record<Priority, number>;
  byPriorityRows.forEach((r) => {
    if (r.priority) byPriority[r.priority] = r._count._all;
  });

  return { total, byStatus, bySeverity, byPriority };
}

export async function developers() {
  const devs = await prisma.user.findMany({
    where: { role: 'DEVELOPER' },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  return Promise.all(
    devs.map(async (user) => {
      const [assigned, closedBugs] = await Promise.all([
        prisma.bug.count({ where: { assigneeId: user.id } }),
        prisma.bug.findMany({
          where: { assigneeId: user.id, status: 'CLOSED', closedAt: { not: null } },
          select: { createdAt: true, closedAt: true },
        }),
      ]);
      const fixed = closedBugs.length;
      const avgFixHours =
        fixed > 0
          ? closedBugs.reduce((sum, b) => sum + (b.closedAt!.getTime() - b.createdAt.getTime()), 0) /
            fixed /
            (60 * 60 * 1000)
          : null;
      return { user, assigned, fixed, avgFixHours };
    }),
  );
}
