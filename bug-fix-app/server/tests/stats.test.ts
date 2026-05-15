import { resetDb, createUser, createBug } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';
import { prisma } from '../src/db';
import type { BugStatus } from '../generated/prisma';

beforeEach(resetDb);

async function adminCookie() {
  const { user } = await createUser({ role: 'SUPERADMIN' });
  return `token=${signJwt({ sub: user.id, role: user.role })}`;
}

describe('GET /api/stats/summary', () => {
  it('returns aggregated counts', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'HIGH' });
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'LOW' });
    await createBug({ reporterId: reporter.id, status: 'FIXED', severity: 'CRITICAL' });
    await createBug({ reporterId: reporter.id, status: 'CLOSED', severity: 'CRITICAL' });

    const res = await api().get('/api/stats/summary').set('Cookie', [await adminCookie()]);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.byStatus.NEW).toBe(2);
    expect(res.body.byStatus.FIXED).toBe(1);
    expect(res.body.byStatus.CLOSED).toBe(1);
    expect(res.body.bySeverity.HIGH).toBe(1);
    expect(res.body.bySeverity.CRITICAL).toBe(2);
    expect(res.body.byPriority).toBeDefined();
  });

  it('forbids non-admin', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const res = await api().get('/api/stats/summary').set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});

async function bugClosedAfterMs(reporterId: string, assigneeId: string, ageMs: number) {
  const created = new Date(Date.now() - ageMs);
  return prisma.bug.create({
    data: {
      title: 'closed bug',
      description: 'x',
      stepsToReproduce: 'x',
      severity: 'MEDIUM',
      status: 'CLOSED' as BugStatus,
      reporterId,
      assigneeId,
      screenshots: [],
      createdAt: created,
      closedAt: new Date(),
    },
  });
}

describe('GET /api/stats/developers', () => {
  it('returns per-developer assigned/fixed counts and avgFixHours', async () => {
    const { user: dev } = await createUser({ role: 'DEVELOPER', email: 'd1@x.com' });
    const { user: dev2 } = await createUser({ role: 'DEVELOPER', email: 'd2@x.com' });
    const { user: reporter } = await createUser({ role: 'TESTER', email: 'r@x.com' });

    // dev: 2 closed bugs (1h, 3h fix time) + 1 open assigned
    await bugClosedAfterMs(reporter.id, dev.id, 1 * 60 * 60 * 1000);
    await bugClosedAfterMs(reporter.id, dev.id, 3 * 60 * 60 * 1000);
    await createBug({ reporterId: reporter.id, assigneeId: dev.id, status: 'IN_PROGRESS' });

    // dev2: nothing
    await createBug({ reporterId: reporter.id, assigneeId: dev2.id, status: 'ASSIGNED' });

    const cookie = await adminCookie();
    const res = await api().get('/api/stats/developers').set('Cookie', [cookie]);
    expect(res.status).toBe(200);

    const dev1Stats = res.body.data.find((d: { user: { id: string } }) => d.user.id === dev.id);
    expect(dev1Stats.assigned).toBe(3);
    expect(dev1Stats.fixed).toBe(2);
    expect(dev1Stats.avgFixHours).toBeCloseTo(2, 1);

    const dev2Stats = res.body.data.find((d: { user: { id: string } }) => d.user.id === dev2.id);
    expect(dev2Stats.assigned).toBe(1);
    expect(dev2Stats.fixed).toBe(0);
    expect(dev2Stats.avgFixHours).toBeNull();
  });
});
