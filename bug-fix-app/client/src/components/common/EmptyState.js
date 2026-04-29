import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function EmptyState({ title, description, action, icon, className, }) {
    return (_jsxs("div", { className: cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-default bg-surface/50 p-12 text-center', className), children: [_jsx("div", { className: "mb-3 text-tertiary", children: icon }), _jsx("h2", { className: "font-display text-base", children: title }), description && _jsx("p", { className: "text-secondary text-sm mt-1", children: description }), action && _jsx("div", { className: "mt-4", children: action })] }));
}
