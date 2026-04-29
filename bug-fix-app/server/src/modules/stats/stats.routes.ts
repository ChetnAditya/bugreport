import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import * as svc from './stats.service';

export const statsRouter = Router();
statsRouter.use(requireAuth, requireRole('SUPERADMIN', 'TEAMLEAD'));

statsRouter.get('/summary', async (req, res, next) => {
  try {
    res.json(await svc.summary(req.user!.role, req.user!.teamId ?? null));
  } catch (e) {
    next(e);
  }
});

statsRouter.get('/developers', async (req, res, next) => {
  try {
    const data = await svc.developers(req.user!.role, req.user!.teamId ?? null);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});
