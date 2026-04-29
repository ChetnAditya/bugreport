import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import { listUsersQuery, changeRoleBody } from './users.schema';
import * as svc from './users.service';
import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get('/', requireRole('SUPERADMIN'), async (req, res, next) => {
  try {
    const q = listUsersQuery.parse(req.query);
    const data = await svc.listUsers(q);
    res.json({ data });
  } catch (e) { next(e); }
});

usersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await svc.getUser(req.params.id);
    res.json({ user });
  } catch (e) { next(e); }
});

usersRouter.patch('/:id/role', requireRole('SUPERADMIN'), async (req, res, next) => {
  try {
    const body = changeRoleBody.parse(req.body);
    const user = await svc.changeRole(req.params.id, body.role);
    res.json({ user });
  } catch (e) { next(e); }
});

usersRouter.patch('/:id/team', requireRole('SUPERADMIN', 'TEAMLEAD'), async (req, res, next) => {
  try {
    const { teamId } = req.body as { teamId: string | null };
    const actor = req.user!;
    if (actor.role === 'TEAMLEAD' && actor.teamId) {
      const target = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (target?.teamId !== actor.teamId) {
        return next(AppError.forbidden('Can only manage own team'));
      }
    }
    const user = await svc.assignUserToTeam(req.params.id, teamId ?? '');
    res.json({ user });
  } catch (e) { next(e); }
});

usersRouter.patch('/:id/manager', requireRole('SUPERADMIN', 'TEAMLEAD'), async (req, res, next) => {
  try {
    const { managerId } = req.body as { managerId: string | null };
    const actor = req.user!;
    if (actor.role === 'TEAMLEAD' && actor.teamId) {
      const target = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (target?.teamId !== actor.teamId) {
        return next(AppError.forbidden('Can only manage own team'));
      }
    }
    const user = await svc.setDirectManager(req.params.id, managerId);
    res.json({ user });
  } catch (e) { next(e); }
});

usersRouter.get('/:id/reports', async (req, res, next) => {
  try {
    const data = await svc.getDirectReports(req.params.id);
    res.json({ data });
  } catch (e) { next(e); }
});
