import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function KpiCard({ label, value, hint, icon, className, }) {
    return (_jsxs("div", { className: cn('rounded-xl border border-default bg-surface p-5', className), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-xs uppercase tracking-wider text-tertiary font-mono", children: label }), _jsx("span", { className: "text-tertiary", children: icon })] }), _jsx("p", { className: "mt-3 font-display text-2xl tabular-nums", children: value }), hint && _jsx("p", { className: "text-xs text-tertiary mt-1", children: hint })] }));
}
