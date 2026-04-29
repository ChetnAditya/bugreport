import { Router, type Response } from 'express';
import { env } from '../../env';
import { registerSchema, loginSchema } from './auth.schema';
import * as svc from './auth.service';
import { requireAuth } from '../../middleware/require-auth';
import { loginLimiter } from '../../middleware/rate-limit';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const { user, token } = await svc.register(input);
    setAuthCookie(res, token);
    res.status(201).json({ user, token });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await svc.login(input);
    setAuthCookie(res, token);
    res.json({ user, token });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await svc.me(req.user!.id);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
