import { resetDb, createUser } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';

beforeEach(resetDb);

describe('requireAuth', () => {
  it('rejects requests with no cookie', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('accepts requests with a valid cookie', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const token = signJwt({ sub: user.id, role: user.role });
    const res = await api().get('/api/auth/me').set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});

describe('requireRole', () => {
  it('allows the matching role', async () => {
    const { user } = await createUser({ role: 'SUPERADMIN' });
    const token = signJwt({ sub: user.id, role: user.role });
    const res = await api().get('/api/admin-test').set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(200);
  });

  it('forbids other roles', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const token = signJwt({ sub: user.id, role: user.role });
    const res = await api().get('/api/admin-test').set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
