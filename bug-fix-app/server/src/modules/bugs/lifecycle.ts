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

  // NEW → ASSIGNED (admin only, must include assigneeId + priority)
  if (fromStatus === 'NEW' && toStatus === 'ASSIGNED') {
    if (actorRole !== 'ADMIN') return { ok: false, reason: 'Only admin can assign' };
    if (!body.assigneeId) return { ok: false, reason: 'assigneeId required' };
    if (!body.priority) return { ok: false, reason: 'priority required' };
    return { ok: true };
  }

  // ASSIGNED → IN_PROGRESS (assignee dev only)
  if (fromStatus === 'ASSIGNED' && toStatus === 'IN_PROGRESS') {
    if (actorRole !== 'DEVELOPER') return { ok: false, reason: 'Only developer can start' };
    if (bugAssigneeId !== actorId) return { ok: false, reason: 'Only assignee can start' };
    return { ok: true };
  }

  // IN_PROGRESS → FIXED (assignee dev only)
  if (fromStatus === 'IN_PROGRESS' && toStatus === 'FIXED') {
    if (actorRole !== 'DEVELOPER') return { ok: false, reason: 'Only developer can mark fixed' };
    if (bugAssigneeId !== actorId) return { ok: false, reason: 'Only assignee can mark fixed' };
    return { ok: true };
  }

  // FIXED → VERIFIED (tester or admin)
  if (fromStatus === 'FIXED' && toStatus === 'VERIFIED') {
    if (actorRole === 'TESTER' || actorRole === 'ADMIN') return { ok: true };
    return { ok: false, reason: 'Only tester/admin can verify' };
  }

  // FIXED → IN_PROGRESS (tester or admin reject)
  if (fromStatus === 'FIXED' && toStatus === 'IN_PROGRESS') {
    if (actorRole === 'TESTER' || actorRole === 'ADMIN') return { ok: true };
    return { ok: false, reason: 'Only tester/admin can reject' };
  }

  // VERIFIED → CLOSED (admin only)
  if (fromStatus === 'VERIFIED' && toStatus === 'CLOSED') {
    if (actorRole !== 'ADMIN') return { ok: false, reason: 'Only admin can close' };
    return { ok: true };
  }

  return { ok: false, reason: `Invalid transition ${fromStatus} → ${toStatus}` };
}
