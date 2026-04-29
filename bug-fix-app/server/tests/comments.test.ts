import { resetDb, createUser, createBug } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';
import type { Role } from '@prisma/client';

beforeEach(resetDb);

async function authedAs(role: Role) {
  const { user } = await createUser({ role });
  return { user, cookie: `token=${signJwt({ sub: user.id, role: user.role })}` };
}

describe('POST /api/bugs/:id/comments', () => {
  it('any authed user can comment', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: reporter.id });
    const { user, cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'Looking into this' });
    expect(res.status).toBe(201);
    expect(res.body.comment).toMatchObject({
      text: 'Looking into this',
      authorId: user.id,
      bugId: bug.id,
    });
  });

  it('rejects empty text', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: reporter.id });
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: '' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing bug', async () => {
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .post(`/api/bugs/nope/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'hi' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/bugs/:id/comments', () => {
  it('returns comments for the bug in chronological order with author', async () => {
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const { user: a, cookie } = await authedAs('DEVELOPER');
    await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'one' });
    await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'two' });
    const res = await api()
      .get(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].text).toBe('one');
    expect(res.body.data[0].author.id).toBe(a.id);
  });
});