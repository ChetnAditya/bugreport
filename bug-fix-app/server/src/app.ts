import express, { type Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { bugsRouter } from './modules/bugs/bugs.routes';
import { requireAuth } from './middleware/require-auth';
import { requireRole } from './middleware/require-role';

export function createApp(): Application {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan('tiny'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/bugs', bugsRouter);

  // test route for requireRole middleware tests
  app.get('/api/admin-test', requireAuth, requireRole('ADMIN'), (_req, res) =>
    res.json({ ok: true }),
  );

  app.use(errorHandler);
  return app;
}
