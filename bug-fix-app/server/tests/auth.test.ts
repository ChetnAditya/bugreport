import { resetDb, createUser } from './helpers/factories';
import { api } from './helpers/api';
import { prisma } from '../src/db';
import { loginLimiter } from '../src/middleware/rate-limit';

beforeEach(resetDb);

describe('POST /api/auth/register', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', password: 'Passw0rd!' };

  it('creates a user with TESTER role and returns a session cookie', async () => {
    const res = await api().post('/api/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: valid.email, role: 'TESTER' });
    expect(res.body.user.passwordHash).toBeUndefined();
    const setCookie = res.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toContain('token=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('rejects invalid email', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('rejects weak password', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('persists a bcrypt-hashed password', async () => {
    await api().post('/api/auth/register').send(valid);
    const row = await prisma.user.findUnique({ where: { email: valid.email } });
    expect(row?.passwordHash).not.toBe(valid.password);
    expect(row?.passwordHash.startsWith('$2')).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  it('returns user + cookie on valid creds', async () => {
    const { user, password } = await createUser({ email: 'a@b.com' });
    const res = await api().post('/api/auth/login').send({ email: 'a@b.com', password });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.headers['set-cookie']?.[0]).toContain('token=');
  });

  it('rejects wrong password', async () => {
    await createUser({ email: 'a@b.com', password: 'Right1234' });
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'Wrong1234' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unknown email with same error', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'no@one.com', password: 'Whatever1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const { user, password } = await createUser({ email: 'me@x.com' });
    const login = await api().post('/api/auth/login').send({ email: 'me@x.com', password });
    const cookie = login.headers['set-cookie']?.[0] ?? '';
    const res = await api().get('/api/auth/me').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const res = await api().post('/api/auth/logout');
    expect(res.status).toBe(204);
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(/token=;/);
  });
});

describe('login rate-limit', () => {
  beforeEach(() => loginLimiter.resetKey('rl@x.com'));

  it('returns 429 after 5 failed attempts in a row', async () => {
    await createUser({ email: 'rl@x.com', password: 'Right1234' });
    const bad = { email: 'rl@x.com', password: 'WrongOne1' };
    for (let i = 0; i < 5; i++) {
      const r = await api().post('/api/auth/login').send(bad);
      expect(r.status).toBe(401);
    }
    const sixth = await api().post('/api/auth/login').send(bad);
    expect(sixth.status).toBe(429);
  });
});
