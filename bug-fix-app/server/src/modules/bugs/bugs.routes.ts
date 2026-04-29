import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import {
  listBugsQuery,
  createBugSchema,
  updateBugSchema,
  transitionSchema,
  addScreenshotsSchema,
} from './bugs.schema';
import { bugCommentsRouter } from '../comments/comments.routes';
import * as svc from './bugs.service';

export const bugsRouter = Router();
bugsRouter.use(requireAuth);

bugsRouter.get('/', async (req, res, next) => {
  try {
    const q = listBugsQuery.parse(req.query);
    res.json(await svc.listBugs(q));
  } catch (e) {
    next(e);
  }
});

bugsRouter.post('/', requireRole('TESTER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = createBugSchema.parse(req.body);
    const bug = await svc.createBug(req.user!.id, input);
    res.status(201).json({ bug });
  } catch (e) {
    next(e);
  }
});

bugsRouter.get('/:id', async (req, res, next) => {
  try {
    const bug = await svc.getBug(req.params.id);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});

bugsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = updateBugSchema.parse(req.body);
    const bug = await svc.updateBug(req.user!.id, req.user!.role, req.params.id, input);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});

bugsRouter.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await svc.deleteBug(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

bugsRouter.post('/:id/transition', async (req, res, next) => {
  try {
    const input = transitionSchema.parse(req.body);
    const bug = await svc.transitionBug(req.user!.id, req.user!.role, req.params.id, input);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});

bugsRouter.get('/:id/screenshots/sign', async (req, res, next) => {
  try {
    res.json(await svc.getScreenshotSignature(req.user!.id, req.params.id));
  } catch (e) {
    next(e);
  }
});

bugsRouter.post('/:id/screenshots', async (req, res, next) => {
  try {
    const { urls } = addScreenshotsSchema.parse(req.body);
    const bug = await svc.addScreenshots(req.user!.id, req.params.id, urls);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});

bugsRouter.use('/:id/comments', bugCommentsRouter);
