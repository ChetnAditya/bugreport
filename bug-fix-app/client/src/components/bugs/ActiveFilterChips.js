import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
const labelMap = {
    status: 'Status',
    severity: 'Severity',
    priority: 'Priority',
    assigneeId: 'Assignee',
    teamId: 'Team',
    q: 'Search',
    page: 'Page',
    limit: 'Limit',
};
export function ActiveFilterChips({ filter, onClear, onRemove, }) {
    const entries = Object.entries(filter).filter(([k, v]) => v !== undefined && k !== 'page' && k !== 'limit');
    if (entries.length === 0)
        return null;
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [entries.map(([k, v]) => (_jsxs("button", { type: "button", onClick: () => onRemove(k), className: "inline-flex items-center gap-1 rounded-md border border-default bg-elevated px-2 py-1 text-xs font-mono text-secondary hover:text-primary", "aria-label": `Remove ${labelMap[k]} filter`, children: [labelMap[k], ": ", String(v), " ", _jsx(X, { className: "h-3 w-3" })] }, k))), _jsx("button", { type: "button", onClick: onClear, className: "text-xs text-tertiary underline hover:text-primary", children: "Clear all" })] }));
}
