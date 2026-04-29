import type { RequestHandler } from 'express';
import { verifyJwt } from '../lib/jwt';
import { AppError } from '../lib/http-error';
import { prisma } from '../db';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.token ?? extractBearer(req.header('authorization'));
  if (!token) return next(AppError.unauthorized());
  try {
    const payload = verifyJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, teamId: true },
    });
    if (!user) return next(AppError.unauthorized('User not found'));
    req.user = { id: user.id, role: user.role, teamId: user.teamId };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
};

function extractBearer(header: string | undefined): string | undefined {
  if (!header?.toLowerCase().startsWith('bearer ')) return undefined;
  return header.slice(7).trim();
}
