import { prisma } from '../../db';
import { SEVERITY, STATUS, PRIORITY } from '../bugs/bugs.schema';
import type { BugStatus, Severity, Priority, Role } from '@prisma/client';

function zeroes<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

export async function summary(actorRole: Role, actorTeamId: string | null) {
  const isSuperadmin = actorRole === 'SUPERADMIN';
  const where = isSuperadmin ? {} : { teamId: actorTeamId ?? undefined };

  const [byStatusRows, bySeverityRows, byPriorityRows, total] = await Promise.all([
    prisma.bug.groupBy({ by: ['status'], _count: { _all: true }, where }),
    prisma.bug.groupBy({ by: ['severity'], _count: { _all: true }, where }),
    prisma.bug.groupBy({ by: ['priority'], _count: { _all: true }, where }),
    prisma.bug.count({ where }),
  ]);

  const byStatus = zeroes(STATUS) as Record<BugStatus, number>;
  byStatusRows.forEach((r) => (byStatus[r.status] = r._count._all));

  const bySeverity = zeroes(SEVERITY) as Record<Severity, number>;
  bySeverityRows.forEach((r) => (bySeverity[r.severity] = r._count._all));

  const byPriority = zeroes(PRIORITY) as Record<Priority, number>;
  byPriorityRows.forEach((r) => {
    if (r.priority) byPriority[r.priority] = r._count._all;
  });

  // Per-team breakdown for superadmin
  if (isSuperadmin) {
    const byTeamRows = await prisma.bug.groupBy({
      by: ['teamId'],
      _count: { _all: true },
    });
    const teams = await prisma.team.findMany({ select: { id: true, name: true } });
    const byTeam: Record<string, { name: string; count: number }> = {};
    byTeamRows.forEach((r) => {
      const team = teams.find((t) => t.id === r.teamId);
      byTeam[r.teamId ?? 'unassigned'] = {
        name: team?.name ?? 'Unassigned',
        count: r._count._all,
      };
    });
    return { total, byStatus, bySeverity, byPriority, byTeam };
  }

  return { total, byStatus, bySeverity, byPriority };
}

export async function developers(actorRole: Role, actorTeamId: string | null) {
  const isSuperadmin = actorRole === 'SUPERADMIN';
  const where = isSuperadmin
    ? { role: 'DEVELOPER' as const }
    : { role: 'DEVELOPER' as const, teamId: actorTeamId ?? undefined };

  const devs = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, teamId: true },
    orderBy: { createdAt: 'asc' },
  });

  return Promise.all(
    devs.map(async (user) => {
      const bugWhere = isSuperadmin
        ? { assigneeId: user.id }
        : { assigneeId: user.id, teamId: actorTeamId ?? undefined };

      const [assigned, closedBugs] = await Promise.all([
        prisma.bug.count({ where: bugWhere }),
        prisma.bug.findMany({
          where: { ...bugWhere, status: 'CLOSED', closedAt: { not: null } },
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
