import 'express';
import type { Role } from '../../generated/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; teamId: string | null };
    }
  }
}
export {};
