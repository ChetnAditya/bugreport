import { prisma } from '../../src/db';
import { hashPassword } from '../../src/lib/password';
import type { Role } from '@prisma/client';

export async function resetDb() {
  await prisma.user.deleteMany();
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
