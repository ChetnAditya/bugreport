import type { BugStatus, Role } from '@/types/domain';

export interface AvailableTransition {
  to: BugStatus;
  label: string;
  needsAssignee?: boolean;
  needsPriority?: boolean;
}

export function availableTransitions(args: {
  currentStatus: BugStatus;
  role: Role;
  isAssignee: boolean;
}): AvailableTransition[] {
  const { currentStatus, role, isAssignee } = args;
  const out: AvailableTransition[] = [];
  if (currentStatus === 'NEW' && role === 'ADMIN') {
    out.push({ to: 'ASSIGNED', label: 'Assign...', needsAssignee: true, needsPriority: true });
  }
  if (currentStatus === 'ASSIGNED' && role === 'DEVELOPER' && isAssignee) {
    out.push({ to: 'IN_PROGRESS', label: 'Start work' });
  }
  if (currentStatus === 'IN_PROGRESS' && role === 'DEVELOPER' && isAssignee) {
    out.push({ to: 'FIXED', label: 'Mark fixed' });
  }
  if (currentStatus === 'FIXED' && (role === 'TESTER' || role === 'ADMIN')) {
    out.push({ to: 'VERIFIED', label: 'Verify fix' });
    out.push({ to: 'IN_PROGRESS', label: 'Reject (back to dev)' });
  }
  if (currentStatus === 'VERIFIED' && role === 'ADMIN') {
    out.push({ to: 'CLOSED', label: 'Close' });
  }
  return out;
}
