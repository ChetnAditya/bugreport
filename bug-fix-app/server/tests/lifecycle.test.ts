import { canTransition, type LifecycleContext } from '../src/modules/bugs/lifecycle';

const baseCtx: LifecycleContext = {
  fromStatus: 'NEW',
  toStatus: 'ASSIGNED',
  actorRole: 'SUPERADMIN',
  actorId: 'u_admin',
  bugAssigneeId: null,
  body: { assigneeId: 'u_dev', priority: 'P2' },
};

describe('canTransition', () => {
  it('admin can NEW → ASSIGNED with assignee + priority', () => {
    expect(canTransition(baseCtx).ok).toBe(true);
  });

  it('admin NEW → ASSIGNED without assigneeId fails', () => {
    expect(canTransition({ ...baseCtx, body: { priority: 'P2' } }).ok).toBe(false);
  });

  it('developer can ASSIGNED → IN_PROGRESS only if assignee', () => {
    expect(
      canTransition({
        ...baseCtx,
        fromStatus: 'ASSIGNED',
        toStatus: 'IN_PROGRESS',
        actorRole: 'DEVELOPER',
        actorId: 'u_dev',
        bugAssigneeId: 'u_dev',
        body: {},
      }).ok,
    ).toBe(true);
  });

  it('developer NOT assignee cannot start work', () => {
    expect(
      canTransition({
        ...baseCtx,
        fromStatus: 'ASSIGNED',
        toStatus: 'IN_PROGRESS',
        actorRole: 'DEVELOPER',
        actorId: 'u_dev2',
        bugAssigneeId: 'u_dev',
        body: {},
      }).ok,
    ).toBe(false);
  });

  it.each([
    ['IN_PROGRESS', 'FIXED', 'DEVELOPER', true],
    ['FIXED', 'VERIFIED', 'TESTER', true],
    ['FIXED', 'IN_PROGRESS', 'TESTER', true],
    ['VERIFIED', 'CLOSED', 'SUPERADMIN', true],
    ['NEW', 'IN_PROGRESS', 'DEVELOPER', false],
    ['CLOSED', 'IN_PROGRESS', 'SUPERADMIN', false],
    ['ASSIGNED', 'CLOSED', 'SUPERADMIN', false],
  ] as const)('%s → %s by %s : %s', (from, to, role, ok) => {
    expect(
      canTransition({
        fromStatus: from,
        toStatus: to,
        actorRole: role,
        actorId: 'u_dev',
        bugAssigneeId: 'u_dev',
        body: { assigneeId: 'u_dev', priority: 'P2' },
      }).ok,
    ).toBe(ok);
  });
});
