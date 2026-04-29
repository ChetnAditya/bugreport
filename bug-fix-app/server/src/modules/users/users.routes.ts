import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import { listUsersQuery, changeRoleBody } from './users.schema';
import * as svc from './users.service';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const q = listUsersQuery.parse(req.query);
    const data = await svc.listUsers(q);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

usersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await svc.getUser(req.params.id);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

usersRouter.patch('/:id/role', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const body = changeRoleBody.parse(req.body);
    const user = await svc.changeRole(req.params.id, body.role);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
