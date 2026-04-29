import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many login attempts' } },
  keyGenerator: (req) => {
    const body = req.body as Record<string, unknown> | undefined;
    return (body?.email as string) ?? req.ip ?? 'unknown';
  },
});
