import express, { type Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env';
import { errorHandler } from './middleware/error-handler';

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

  app.use(errorHandler);
  return app;
}
