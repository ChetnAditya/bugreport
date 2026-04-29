import { resetDb, createUser, createBug } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';
import type { Role, BugStatus } from '@prisma/client';

beforeEach(resetDb);

async function authedAs(role: Role) {
  const { user } = await createUser({ role });
  return { user, cookie: `token=${signJwt({ sub: user.id, role: user.role })}` };
}

async function makeBug(status: BugStatus, opts: { assigneeId?: string } = {}) {
  const { user: reporter } = await createUser({ role: 'TESTER' });
  return createBug({ reporterId: reporter.id, status, ...opts });
}

describe('GET /api/bugs', () => {
  it('returns paginated bugs filterable by status/severity', async () => {
    const { user: reporter, cookie } = await authedAs('SUPERADMIN');
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'HIGH' });
    await createBug({ reporterId: reporter.id, status: 'CLOSED', severity: 'LOW' });
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'CRITICAL' });

    const res = await api()
      .get('/api/bugs?status=NEW&page=1&limit=10')
      .set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    res.body.data.forEach((b: { status: string }) => expect(b.status).toBe('NEW'));
  });

  it('text search hits title and description', async () => {
    const { user: reporter, cookie } = await authedAs('SUPERADMIN');
    await createBug({ reporterId: reporter.id, title: 'Login button broken' });
    await createBug({ reporterId: reporter.id, title: 'Sign up page' });
    const res = await api().get('/api/bugs?q=login').set('Cookie', [cookie]);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].title).toMatch(/login/i);
  });

  it('rejects unauthenticated', async () => {
    const res = await api().get('/api/bugs');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/bugs', () => {
  const valid = {
    title: 'Login fails',
    description: 'Clicking login does nothing on Chrome 121',
    stepsToReproduce: '1. Open /login 2. Click button 3. Nothing happens',
    severity: 'HIGH',
  };

  it('tester can create a bug — defaults to NEW status', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const res = await api().post('/api/bugs').set('Cookie', [cookie]).send(valid);
    expect(res.status).toBe(201);
    expect(res.body.bug).toMatchObject({
      title: valid.title,
      status: 'NEW',
      severity: 'HIGH',
      reporterId: user.id,
      priority: null,
    });
  });

  it('developer cannot create bugs', async () => {
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api().post('/api/bugs').set('Cookie', [cookie]).send(valid);
    expect(res.status).toBe(403);
  });

  it('validation errors on missing fields', async () => {
    const { cookie } = await authedAs('TESTER');
    const res = await api()
      .post('/api/bugs')
      .set('Cookie', [cookie])
      .send({ title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
});

describe('GET /api/bugs/:id', () => {
  it('returns the bug with reporter/assignee + comments[]', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id });
    const res = await api().get(`/api/bugs/${bug.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.bug.id).toBe(bug.id);
    expect(res.body.bug.reporter.id).toBe(user.id);
    expect(Array.isArray(res.body.bug.comments)).toBe(true);
  });

  it('404 when missing', async () => {
    const { cookie } = await authedAs('TESTER');
    const res = await api().get('/api/bugs/nope').set('Cookie', [cookie]);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/bugs/:id', () => {
  it('reporter can edit while status=NEW', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id, status: 'NEW' });
    const res = await api()
      .patch(`/api/bugs/${bug.id}`)
      .set('Cookie', [cookie])
      .send({ title: 'Updated title' });
    expect(res.status).toBe(200);
    expect(res.body.bug.title).toBe('Updated title');
  });

  it('non-reporter is forbidden', async () => {
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const { cookie } = await authedAs('TESTER');
    const res = await api()
      .patch(`/api/bugs/${bug.id}`)
      .set('Cookie', [cookie])
      .send({ title: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('reporter cannot edit once status leaves NEW', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id, status: 'ASSIGNED' });
    const res = await api()
      .patch(`/api/bugs/${bug.id}`)
      .set('Cookie', [cookie])
      .send({ title: 'Late edit' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/bugs/:id', () => {
  it('admin can delete', async () => {
    const { cookie } = await authedAs('SUPERADMIN');
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const res = await api().delete(`/api/bugs/${bug.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(204);
  });

  it('non-admin cannot delete', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id });
    const res = await api().delete(`/api/bugs/${bug.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/bugs/:id/transition', () => {
  it('admin assigns NEW → ASSIGNED with priority + assignee', async () => {
    const { cookie } = await authedAs('SUPERADMIN');
    const { user: dev } = await createUser({ role: 'DEVELOPER' });
    const bug = await makeBug('NEW');
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'ASSIGNED', assigneeId: dev.id, priority: 'P2' });
    expect(res.status).toBe(200);
    expect(res.body.bug.status).toBe('ASSIGNED');
    expect(res.body.bug.assigneeId).toBe(dev.id);
    expect(res.body.bug.priority).toBe('P2');
  });

  it('developer assignee starts work', async () => {
    const { user: dev } = await createUser({ role: 'DEVELOPER' });
    const cookie = `token=${signJwt({ sub: dev.id, role: dev.role })}`;
    const bug = await makeBug('ASSIGNED', { assigneeId: dev.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.bug.status).toBe('IN_PROGRESS');
  });

  it('admin VERIFIED → CLOSED sets closedAt', async () => {
    const { cookie } = await authedAs('SUPERADMIN');
    const bug = await makeBug('VERIFIED');
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'CLOSED' });
    expect(res.status).toBe(200);
    expect(res.body.bug.closedAt).toBeTruthy();
  });

  it('rejects illegal transitions with 400', async () => {
    const { cookie } = await authedAs('SUPERADMIN');
    const bug = await makeBug('NEW');
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'CLOSED' });
    expect(res.status).toBe(400);
  });

  it('rejects developer not-assignee', async () => {
    const { user: dev2 } = await createUser({ role: 'DEVELOPER' });
    const cookie = `token=${signJwt({ sub: dev2.id, role: dev2.role })}`;
    const { user: dev1 } = await createUser({ role: 'DEVELOPER' });
    const bug = await makeBug('ASSIGNED', { assigneeId: dev1.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'IN_PROGRESS' });
    expect(res.status).toBe(403);
  });
});
