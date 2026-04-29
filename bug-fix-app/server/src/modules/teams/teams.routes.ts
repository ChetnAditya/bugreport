import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import * as svc from './teams.service';
import { z } from 'zod';

export const teamsRouter = Router();
teamsRouter.use(requireAuth);

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const createTeamSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
});
type CreateTeam = z.infer<typeof createTeamSchema>;

const updateTeamSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
});
type UpdateTeam = z.infer<typeof updateTeamSchema>;

teamsRouter.get('/', async (req, res, next) => {
  try {
    const data = await svc.listTeams(
      req.user!.id,
      req.user!.role,
      req.user!.teamId ?? null,
    );
    res.json({ data });
  } catch (e) { next(e); }
});

teamsRouter.post('/', requireRole('SUPERADMIN'), async (req, res, next) => {
  try {
    const body = createTeamSchema.parse(req.body);
    const data = await svc.createTeam({
      ...body,
      slug: slugify(body.name),
    });
    res.status(201).json({ data });
  } catch (e) { next(e); }
});

teamsRouter.get('/:id', async (req, res, next) => {
  try {
    const data = await svc.getTeam(req.params.id);
    res.json({ data });
  } catch (e) { next(e); }
});

teamsRouter.patch('/:id', requireRole('SUPERADMIN'), async (req, res, next) => {
  try {
    const body = updateTeamSchema.parse(req.body);
    const data = await svc.updateTeam(req.params.id, body);
    res.json({ data });
  } catch (e) { next(e); }
});

teamsRouter.delete('/:id', requireRole('SUPERADMIN'), async (req, res, next) => {
  try {
    await svc.deleteTeam(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

teamsRouter.get('/:id/members', async (req, res, next) => {
  try {
    const data = await svc.listTeamMembers(req.params.id);
    res.json({ data });
  } catch (e) { next(e); }
});
