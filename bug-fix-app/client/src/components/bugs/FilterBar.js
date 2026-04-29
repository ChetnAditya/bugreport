import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
const STATUS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'];
const SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY = ['P1', 'P2', 'P3', 'P4'];
export function FilterBar({ filter, onChange, }) {
    const [q, setQ] = useState(filter.q ?? '');
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("form", { className: "relative flex-1 min-w-[220px]", onSubmit: (e) => {
                    e.preventDefault();
                    onChange({ q: q || undefined });
                }, role: "search", children: [_jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" }), _jsx(Input, { "aria-label": "Search bugs", placeholder: "Search bugs...", value: q, onChange: (e) => setQ(e.target.value), className: "pl-9" })] }), _jsx(FilterDropdown, { label: "Status", value: filter.status, options: STATUS, onChange: (v) => onChange({ status: v }) }), _jsx(FilterDropdown, { label: "Severity", value: filter.severity, options: SEVERITY, onChange: (v) => onChange({ severity: v }) }), _jsx(FilterDropdown, { label: "Priority", value: filter.priority, options: PRIORITY, onChange: (v) => onChange({ priority: v }) })] }));
}
function FilterDropdown({ label, value, options, onChange, }) {
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "font-mono", children: [label, value ? `: ${value}` : ''] }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuLabel, { children: label }), _jsx(DropdownMenuSeparator, {}), options.map((o) => (_jsx(DropdownMenuItem, { onSelect: () => onChange(o), children: o }, o))), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { onSelect: () => onChange(undefined), children: "Clear" })] })] }));
}
