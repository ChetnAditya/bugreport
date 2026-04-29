import { prisma } from '../../db';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signJwt } from '../../lib/jwt';
import { AppError } from '../../lib/http-error';
import type { RegisterInput, LoginInput } from './auth.schema';

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  teamId: true,
  directManagerId: true,
} as const;

const fullUserSelect = {
  ...safeUserSelect,
  team: { select: { id: true, name: true, slug: true } },
  directManager: { select: { id: true, name: true, email: true } },
} as const;

export async function register(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw AppError.conflict('Email already registered');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
    },
    select: safeUserSelect,
  });
  const token = signJwt({ sub: user.id, role: user.role });
  return { user, token };
}

export async function login(input: LoginInput) {
  const row = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, name: true, passwordHash: true, role: true, createdAt: true, teamId: true, directManagerId: true },
  });
  if (!row) throw AppError.unauthorized('Invalid credentials');
  const ok = await verifyPassword(input.password, row.passwordHash);
  if (!ok) throw AppError.unauthorized('Invalid credentials');
  const { passwordHash: _ph, ...user } = row;
  const token = signJwt({ sub: user.id, role: user.role });
  return { user, token };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: fullUserSelect,
  });
  if (!user) throw AppError.unauthorized();
  return user;
}
