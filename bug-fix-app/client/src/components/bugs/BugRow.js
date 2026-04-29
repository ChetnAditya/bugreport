import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { SeverityChip } from './SeverityChip';
import { PriorityChip } from './PriorityChip';
export function BugRow({ bug }) {
    return (_jsxs(Link, { to: `/bugs/${bug.id}`, className: "grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 border-b border-default px-4 py-3 hover:bg-elevated focus-visible:bg-elevated min-h-[56px]", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-display text-sm", children: bug.title }), _jsxs("p", { className: "text-xs text-tertiary", children: [bug.reporter?.name ?? '—', " \u00B7 opened", ' ', formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })] })] }), _jsx(SeverityChip, { severity: bug.severity }), _jsx(PriorityChip, { priority: bug.priority }), _jsx("span", { className: "text-xs text-tertiary font-mono hidden md:inline", children: bug.assignee?.name ?? 'Unassigned' }), _jsx(StatusBadge, { status: bug.status })] }));
}
