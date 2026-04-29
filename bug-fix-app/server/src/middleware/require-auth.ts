import type { RequestHandler } from 'express';
import { verifyJwt } from '../lib/jwt';
import { AppError } from '../lib/http-error';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.token ?? extractBearer(req.header('authorization'));
  if (!token) return next(AppError.unauthorized());
  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
};

function extractBearer(header: string | undefined): string | undefined {
  if (!header?.toLowerCase().startsWith('bearer ')) return undefined;
  return header.slice(7).trim();
}
