import type { RequestHandler } from 'express';
import type { Role } from '../../generated/prisma';
import { AppError } from '../lib/http-error';

export const requireRole = (...allowed: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
};
