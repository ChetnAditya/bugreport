import { resetDb, createUser, createBug } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';

jest.mock('../src/lib/cloudinary', () => ({
  signUpload: () => ({
    cloudName: 'demo',
    apiKey: 'k',
    timestamp: 1700000000,
    folder: 'bugs',
    signature: 'fake',
  }),
}));

beforeEach(resetDb);

describe('GET /api/bugs/:id/screenshots/sign', () => {
  it('reporter gets a signature', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .get(`/api/bugs/${bug.id}/screenshots/sign`)
      .set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.signature).toBe('fake');
    expect(res.body.cloudName).toBe('demo');
  });

  it('non-reporter cannot sign', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    const { user: other } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: other.id, role: other.role })}`;
    const bug = await createBug({ reporterId: reporter.id });
    const res = await api()
      .get(`/api/bugs/${bug.id}/screenshots/sign`)
      .set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/bugs/:id/screenshots', () => {
  const validUrl = 'https://res.cloudinary.com/demo/image/upload/bugs/abc.png';

  it('reporter persists uploaded URLs (cap 5 total)', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/screenshots`)
      .set('Cookie', [cookie])
      .send({ urls: [validUrl, validUrl] });
    expect(res.status).toBe(200);
    expect(res.body.bug.screenshots).toHaveLength(2);
  });

  it('rejects non-cloudinary URLs', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/screenshots`)
      .set('Cookie', [cookie])
      .send({ urls: ['https://evil.example.com/img.png'] });
    expect(res.status).toBe(400);
  });

  it('rejects more than 5 total screenshots', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/screenshots`)
      .set('Cookie', [cookie])
      .send({ urls: Array(6).fill(validUrl) });
    expect(res.status).toBe(400);
  });
});
