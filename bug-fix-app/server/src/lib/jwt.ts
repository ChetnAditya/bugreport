import jwt from 'jsonwebtoken';
import type { Role } from '../../generated/prisma';
import { env } from '../env';

export interface JwtPayload {
  sub: string;
  role: Role;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
}

export function verifyJwt(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded === 'string') throw new Error('invalid token');
  return decoded as JwtPayload;
}
