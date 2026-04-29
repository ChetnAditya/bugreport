import { resetDb, createUser } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';
import type { Role } from '@prisma/client';

beforeEach(resetDb);

async function authedAs(role: Role) {
  const { user } = await createUser({ role });
  const token = signJwt({ sub: user.id, role: user.role });
  return { user, cookie: `token=${token}` };
}

describe('GET /api/users', () => {
  it('admin can list users, optionally filtered by role', async () => {
    await createUser({ email: 'd@x.com', role: 'DEVELOPER' });
    await createUser({ email: 't@x.com', role: 'TESTER' });
    const { cookie } = await authedAs('ADMIN');
    const res = await api().get('/api/users?role=DEVELOPER').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].role).toBe('DEVELOPER');
    expect(res.body.data[0].passwordHash).toBeUndefined();
  });

  it('non-admin gets 403', async () => {
    const { cookie } = await authedAs('TESTER');
    const res = await api().get('/api/users').set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/users/:id/role', () => {
  it('admin can promote a user to DEVELOPER', async () => {
    const { user: target } = await createUser({ role: 'TESTER' });
    const { cookie } = await authedAs('ADMIN');
    const res = await api()
      .patch(`/api/users/${target.id}/role`)
      .set('Cookie', [cookie])
      .send({ role: 'DEVELOPER' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('DEVELOPER');
  });

  it('non-admin cannot change roles', async () => {
    const { user: target } = await createUser({ role: 'TESTER' });
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .patch(`/api/users/${target.id}/role`)
      .set('Cookie', [cookie])
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  it('returns 404 on missing user', async () => {
    const { cookie } = await authedAs('ADMIN');
    const res = await api()
      .patch('/api/users/does-not-exist/role')
      .set('Cookie', [cookie])
      .send({ role: 'DEVELOPER' });
    expect(res.status).toBe(404);
  });
});
