import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';
import { signUpload } from '../../lib/cloudinary';
import type { ListBugsQuery, CreateBugInput, UpdateBugInput, TransitionInput } from './bugs.schema';
import type { Role } from '../../../generated/prisma';
import { canTransition } from './lifecycle';

export async function listBugs(
  actorId: string,
  actorRole: Role,
  actorTeamId: string | null,
  q: ListBugsQuery,
) {
  const isSuperadmin = actorRole === 'SUPERADMIN';

  const where = {
    ...(q.status && { status: q.status }),
    ...(q.severity && { severity: q.severity }),
    ...(q.priority && { priority: q.priority }),
    ...(q.assigneeId && { assigneeId: q.assigneeId }),
    ...(q.teamId && { teamId: q.teamId }),
    ...(q.q && {
      OR: [
        { title: { contains: q.q, mode: 'insensitive' as const } },
        { description: { contains: q.q, mode: 'insensitive' as const } },
      ],
    }),
  };

  // Non-superadmin users only see bugs from their team
  if (!isSuperadmin && actorTeamId) {
    where.teamId = actorTeamId;
  }

  const [total, data] = await Promise.all([
    prisma.bug.count({ where }),
    prisma.bug.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
        team: { select: { id: true, name: true } },
      },
    }),
  ]);
  return { data, total, page: q.page, limit: q.limit };
}

export async function createBug(
  reporterId: string,
  reporterRole: Role,
  reporterTeamId: string | null,
  input: CreateBugInput,
) {
  return prisma.bug.create({
    data: {
      ...input,
      screenshots: input.screenshots ?? [],
      reporterId,
      teamId: reporterTeamId,
    },
  });
}

export async function getBug(id: string) {
  const bug = await prisma.bug.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, email: true, role: true } },
      assignee: { select: { id: true, name: true, email: true, role: true } },
      team: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });
  if (!bug) throw AppError.notFound('Bug not found');
  return bug;
}

export async function updateBug(
  actorId: string,
  actorRole: Role,
  actorTeamId: string | null,
  id: string,
  input: UpdateBugInput,
) {
  const bug = await prisma.bug.findUnique({ where: { id } });
  if (!bug) throw AppError.notFound('Bug not found');

  const isSuperadmin = actorRole === 'SUPERADMIN';
  const isReporter = bug.reporterId === actorId;

  if (!isReporter && !isSuperadmin) throw AppError.forbidden();
  if (bug.status !== 'NEW') throw AppError.badRequest('Bug can only be edited while status is NEW');

  // Team check for non-superadmin
  if (!isSuperadmin && actorTeamId && bug.teamId !== actorTeamId) {
    throw AppError.forbidden();
  }

  return prisma.bug.update({ where: { id }, data: input });
}

export async function deleteBug(id: string) {
  const exists = await prisma.bug.findUnique({ where: { id } });
  if (!exists) throw AppError.notFound('Bug not found');
  await prisma.bug.delete({ where: { id } });
}

export async function transitionBug(
  actorId: string,
  actorRole: Role,
  actorTeamId: string | null,
  id: string,
  input: TransitionInput,
) {
  const bug = await prisma.bug.findUnique({ where: { id } });
  if (!bug) throw AppError.notFound('Bug not found');

  const isSuperadmin = actorRole === 'SUPERADMIN';
  if (!isSuperadmin && actorTeamId && bug.teamId !== actorTeamId) {
    throw AppError.forbidden();
  }

  const result = canTransition({
    fromStatus: bug.status,
    toStatus: input.to,
    actorRole,
    actorId,
    bugAssigneeId: bug.assigneeId,
    body: { assigneeId: input.assigneeId, priority: input.priority },
  });
  if (!result.ok) {
    if (
      result.reason.toLowerCase().includes('only') ||
      result.reason.toLowerCase().includes('assignee')
    ) {
      throw AppError.forbidden(result.reason);
    }
    throw AppError.badRequest(result.reason);
  }

  const updates: Parameters<typeof prisma.bug.update>[0]['data'] = { status: input.to };
  if (input.to === 'ASSIGNED') {
    updates.assigneeId = input.assigneeId!;
    updates.priority = input.priority!;
  }
  if (input.to === 'CLOSED') updates.closedAt = new Date();

  return prisma.bug.update({ where: { id }, data: updates });
}

const MAX_SCREENSHOTS = 5;

export async function getScreenshotSignature(
  actorId: string,
  actorTeamId: string | null,
  bugId: string,
) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  if (bug.reporterId !== actorId) throw AppError.forbidden();
  return signUpload(`bugs/${bugId}`);
}

export async function addScreenshots(
  actorId: string,
  actorTeamId: string | null,
  bugId: string,
  urls: string[],
) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  if (bug.reporterId !== actorId) throw AppError.forbidden();
  const next = [...bug.screenshots, ...urls];
  if (next.length > MAX_SCREENSHOTS) {
    throw AppError.badRequest(`Max ${MAX_SCREENSHOTS} screenshots per bug`);
  }
  return prisma.bug.update({ where: { id: bugId }, data: { screenshots: next } });
}
