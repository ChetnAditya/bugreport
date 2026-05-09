export function availableTransitions(args) {
    const { currentStatus, role, isAssignee } = args;
    const out = [];
    if (currentStatus === 'NEW' && role === 'SUPERADMIN') {
        out.push({ to: 'ASSIGNED', label: 'Assign...', needsAssignee: true, needsPriority: true });
    }
    if (currentStatus === 'ASSIGNED' && role === 'DEVELOPER' && isAssignee) {
        out.push({ to: 'IN_PROGRESS', label: 'Start work' });
    }
    if (currentStatus === 'IN_PROGRESS' && role === 'DEVELOPER' && isAssignee) {
        out.push({ to: 'FIXED', label: 'Mark fixed' });
    }
    if (currentStatus === 'FIXED' && (role === 'TESTER' || role === 'TEAMLEAD' || role === 'SUPERADMIN')) {
        out.push({ to: 'VERIFIED', label: 'Verify fix' });
        out.push({ to: 'IN_PROGRESS', label: 'Reject (back to dev)' });
    }
    if (currentStatus === 'VERIFIED' && (role === 'TEAMLEAD' || role === 'SUPERADMIN')) {
        out.push({ to: 'CLOSED', label: 'Close' });
    }
    return out;
}
