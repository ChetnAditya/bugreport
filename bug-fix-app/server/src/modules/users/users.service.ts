import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';
import type { Role } from '@prisma/client';

const safeSelect = { id: true, email: true, name: true, role: true, createdAt: true } as const;

export async function listUsers(filter: { role?: Role }) {
  return prisma.user.findMany({
    where: filter.role ? { role: filter.role } : undefined,
    orderBy: { createdAt: 'desc' },
    select: safeSelect,
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
  if (!user) throw AppError.notFound('User not found');
  return user;
}

export async function changeRole(id: string, role: Role) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw AppError.notFound('User not found');
  return prisma.user.update({ where: { id }, data: { role }, select: safeSelect });
}
