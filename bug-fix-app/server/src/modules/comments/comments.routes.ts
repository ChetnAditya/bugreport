import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { createCommentSchema, updateCommentSchema } from './comments.schema';
import * as svc from './comments.service';

export const bugCommentsRouter = Router({ mergeParams: true });
bugCommentsRouter.use(requireAuth);

bugCommentsRouter.get('/', async (req, res, next) => {
  try {
    const data = await svc.listComments((req.params as { id: string }).id);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

bugCommentsRouter.post('/', async (req, res, next) => {
  try {
    const input = createCommentSchema.parse(req.body);
    const comment = await svc.createComment(
      req.user!.id,
      (req.params as { id: string }).id,
      input,
    );
    res.status(201).json({ comment });
  } catch (e) {
    next(e);
  }
});

export const commentsRouter = Router();
commentsRouter.use(requireAuth);

commentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = updateCommentSchema.parse(req.body);
    const comment = await svc.updateComment(req.user!.id, req.user!.role, req.params.id, input);
    res.json({ comment });
  } catch (e) {
    next(e);
  }
});

commentsRouter.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteComment(req.user!.id, req.user!.role, req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});