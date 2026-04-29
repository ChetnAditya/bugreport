import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';
import type { Role } from '@prisma/client';

const safeSelect = {
  id: true, email: true, name: true, role: true, createdAt: true,
  teamId: true,
  directManagerId: true,
} as const;

const fullSelect = {
  ...safeSelect,
  team: { select: { id: true, name: true, slug: true } },
  directManager: { select: { id: true, name: true, email: true } },
} as const;

export async function listUsers(filter: { role?: Role; teamId?: string }) {
  return prisma.user.findMany({
    where: {
      ...(filter.role && { role: filter.role }),
      ...(filter.teamId && { teamId: filter.teamId }),
    },
    orderBy: { createdAt: 'desc' },
    select: fullSelect,
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: fullSelect });
  if (!user) throw AppError.notFound('User not found');
  return user;
}

export async function changeRole(id: string, role: Role) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw AppError.notFound('User not found');
  return prisma.user.update({ where: { id }, data: { role }, select: safeSelect });
}

export async function assignUserToTeam(userId: string, teamId: string) {
  if (!teamId) {
    return prisma.user.update({ where: { id: userId }, data: { teamId: null }, select: safeSelect });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound('User not found');
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw AppError.notFound('Team not found');
  return prisma.user.update({ where: { id: userId }, data: { teamId }, select: safeSelect });
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
    select: safeSelect,
  });
}

export async function getDirectReports(managerId: string) {
  return prisma.user.findMany({
    where: { directManagerId: managerId },
    orderBy: { name: 'asc' },
    select: safeSelect,
  });
}
