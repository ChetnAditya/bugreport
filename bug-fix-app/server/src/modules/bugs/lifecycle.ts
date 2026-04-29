import type { Role, BugStatus, Priority } from '@prisma/client';

export interface LifecycleContext {
  fromStatus: BugStatus;
  toStatus: BugStatus;
  actorRole: Role;
  actorId: string;
  bugAssigneeId: string | null;
  body: { assigneeId?: string; priority?: Priority };
}

export type Result = { ok: true } | { ok: false; reason: string };

export function canTransition(ctx: LifecycleContext): Result {
  const { fromStatus, toStatus, actorRole, actorId, bugAssigneeId, body } = ctx;

  // SUPERADMIN can do anything admin could do
  const isAdminOrSuperadmin = actorRole === 'SUPERADMIN';

  // NEW → ASSIGNED (superadmin only, must include assigneeId + priority)
  if (fromStatus === 'NEW' && toStatus === 'ASSIGNED') {
    if (!isAdminOrSuperadmin) return { ok: false, reason: 'Only superadmin can assign' };
    if (!body.assigneeId) return { ok: false, reason: 'assigneeId required' };
    if (!body.priority) return { ok: false, reason: 'priority required' };
    return { ok: true };
  }

  // ASSIGNED → IN_PROGRESS (assignee dev only, or superadmin)
  if (fromStatus === 'ASSIGNED' && toStatus === 'IN_PROGRESS') {
    if (actorRole === 'SUPERADMIN') return { ok: true };
    if (actorRole !== 'DEVELOPER') return { ok: false, reason: 'Only developer can start' };
    if (bugAssigneeId !== actorId) return { ok: false, reason: 'Only assignee can start' };
    return { ok: true };
  }

  // IN_PROGRESS → FIXED (assignee dev only, or superadmin)
  if (fromStatus === 'IN_PROGRESS' && toStatus === 'FIXED') {
    if (actorRole === 'SUPERADMIN') return { ok: true };
    if (actorRole !== 'DEVELOPER') return { ok: false, reason: 'Only developer can mark fixed' };
    if (bugAssigneeId !== actorId) return { ok: false, reason: 'Only assignee can mark fixed' };
    return { ok: true };
  }

  // FIXED → VERIFIED (tester, teamlead, or superadmin)
  if (fromStatus === 'FIXED' && toStatus === 'VERIFIED') {
    if (actorRole === 'SUPERADMIN' || actorRole === 'TESTER' || actorRole === 'TEAMLEAD') return { ok: true };
    return { ok: false, reason: 'Only tester/teamlead can verify' };
  }

  // FIXED → IN_PROGRESS (tester, teamlead, or superadmin reject)
  if (fromStatus === 'FIXED' && toStatus === 'IN_PROGRESS') {
    if (actorRole === 'SUPERADMIN' || actorRole === 'TESTER' || actorRole === 'TEAMLEAD') return { ok: true };
    return { ok: false, reason: 'Only tester/teamlead can reject' };
  }

  // VERIFIED → CLOSED (teamlead or superadmin)
  if (fromStatus === 'VERIFIED' && toStatus === 'CLOSED') {
    if (actorRole === 'SUPERADMIN' || actorRole === 'TEAMLEAD') return { ok: true };
    return { ok: false, reason: 'Only teamlead/superadmin can close' };
  }

  return { ok: false, reason: `Invalid transition ${fromStatus} → ${toStatus}` };
}
