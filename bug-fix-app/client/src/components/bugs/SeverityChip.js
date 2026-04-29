import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
const map = {
    LOW: { label: 'Low', cls: 'text-sev-low' },
    MEDIUM: { label: 'Medium', cls: 'text-sev-med' },
    HIGH: { label: 'High', cls: 'text-sev-high' },
    CRITICAL: { label: 'Critical', cls: 'text-sev-critical' },
};
export function SeverityChip({ severity, className }) {
    const m = map[severity];
    return (_jsxs("span", { className: cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono', m.cls, className), "aria-label": `Severity: ${m.label}`, children: [_jsx(ShieldAlert, { className: "h-3.5 w-3.5", "aria-hidden": true }), " ", m.label] }));
}
