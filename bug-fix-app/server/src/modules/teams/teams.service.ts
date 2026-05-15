import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';
import type { Role } from '../../../generated/prisma';

export async function listTeams(actorId: string, actorRole: Role, actorTeamId: string | null) {
  if (actorRole === 'SUPERADMIN') {
    return prisma.team.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true, bugs: true } } },
    });
  }
  return prisma.team.findMany({
    where: { id: actorTeamId ?? undefined },
    include: { _count: { select: { members: true, bugs: true } } },
  });
}

export async function getTeam(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: { _count: { select: { members: true, bugs: true } } },
  });
  if (!team) throw AppError.notFound('Team not found');
  return team;
}

export async function createTeam(data: { name: string; slug: string; description?: string }) {
  const existing = await prisma.team.findUnique({ where: { slug: data.slug } });
  if (existing) throw AppError.badRequest('Slug already taken');
  return prisma.team.create({ data });
}

export async function updateTeam(id: string, data: { name?: string; description?: string }) {
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) throw AppError.notFound('Team not found');
  return prisma.team.update({ where: { id }, data });
}

export async function deleteTeam(id: string) {
  const team = await prisma.team.findUnique({
    where: { id },
    include: { _count: { select: { members: true, bugs: true } } },
  });
  if (!team) throw AppError.notFound('Team not found');
  if (team._count.members > 0) throw AppError.badRequest('Cannot delete team with members');
  if (team._count.bugs > 0) throw AppError.badRequest('Cannot delete team with bugs');
  await prisma.team.delete({ where: { id } });
}

export async function listTeamMembers(teamId: string) {
  return prisma.user.findMany({
    where: { teamId },
    orderBy: { name: 'asc' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function assignUserToTeam(userId: string, teamId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw AppError.notFound('Team not found');
  return prisma.user.update({ where: { id: userId }, data: { teamId } });
}

export async function setDirectManager(userId: string, managerId: string | null) {
  if (managerId === userId) throw AppError.badRequest('Cannot be own manager');
  if (managerId) {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager) throw AppError.notFound('Manager not found');
  }
  return prisma.user.update({
    where: { id: userId },
    data: { directManagerId: managerId },
    select: { id: true, name: true, email: true, role: true, teamId: true, directManagerId: true },
  });
}

export async function getDirectReports(managerId: string) {
  return prisma.user.findMany({
    where: { directManagerId: managerId },
    orderBy: { name: 'asc' },
    select: { id: true, email: true, name: true, role: true, teamId: true },
  });
}
