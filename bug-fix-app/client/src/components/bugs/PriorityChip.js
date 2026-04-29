import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
const map = {
    P1: 'bg-rose-400/15 text-rose-300',
    P2: 'bg-amber-400/15 text-amber-300',
    P3: 'bg-sky-400/15 text-sky-300',
    P4: 'bg-zinc-400/15 text-tertiary',
};
export function PriorityChip({ priority, className }) {
    if (!priority) {
        return (_jsx("span", { className: cn('inline-flex items-center text-xs text-tertiary font-mono', className), "aria-label": "No priority", children: "\u2014" }));
    }
    return (_jsx("span", { className: cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono', map[priority], className), "aria-label": `Priority: ${priority}`, children: priority }));
}
