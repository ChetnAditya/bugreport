import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import * as svc from './stats.service';

export const statsRouter = Router();
statsRouter.use(requireAuth, requireRole('ADMIN'));

statsRouter.get('/summary', async (_req, res, next) => {
  try {
    res.json(await svc.summary());
  } catch (e) {
    next(e);
  }
});

statsRouter.get('/developers', async (_req, res, next) => {
  try {
    const data = await svc.developers();
    res.json({ data });
  } catch (e) {
    next(e);
  }
});
