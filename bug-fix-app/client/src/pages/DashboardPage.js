import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Bug, ShieldAlert, Hourglass, CheckCircle2 } from 'lucide-react';
import { useBugList } from '@/hooks/bugs/use-bugs';
import { KpiCard } from '@/components/common/KpiCard';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/bugs/StatusBadge';
import { SeverityChip } from '@/components/bugs/SeverityChip';
import { EmptyState } from '@/components/common/EmptyState';
export function DashboardPage() {
    const recent = useBugList({ page: 1, limit: 8 });
    const open = useBugList({ status: 'NEW', page: 1, limit: 1 });
    const wip = useBugList({ status: 'IN_PROGRESS', page: 1, limit: 1 });
    const fixed = useBugList({ status: 'FIXED', page: 1, limit: 1 });
    const closed = useBugList({ status: 'CLOSED', page: 1, limit: 1 });
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("h1", { className: "font-display text-xl", children: "Dashboard" }), _jsxs("section", { "aria-label": "Bug counts", className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [_jsx(KpiCard, { label: "New", value: open.data?.total ?? _jsx(Skeleton, { className: "h-8 w-16" }), icon: _jsx(Bug, { className: "h-4 w-4" }) }), _jsx(KpiCard, { label: "In progress", value: wip.data?.total ?? _jsx(Skeleton, { className: "h-8 w-16" }), icon: _jsx(Hourglass, { className: "h-4 w-4" }) }), _jsx(KpiCard, { label: "Fixed", value: fixed.data?.total ?? _jsx(Skeleton, { className: "h-8 w-16" }), icon: _jsx(ShieldAlert, { className: "h-4 w-4" }) }), _jsx(KpiCard, { label: "Closed", value: closed.data?.total ?? _jsx(Skeleton, { className: "h-8 w-16" }), icon: _jsx(CheckCircle2, { className: "h-4 w-4" }) })] }), _jsxs("section", { "aria-labelledby": "recent-heading", className: "rounded-xl border border-default bg-surface", children: [_jsxs("header", { className: "flex items-center justify-between border-b border-default px-5 py-3", children: [_jsx("h2", { id: "recent-heading", className: "font-display text-base", children: "Recent bugs" }), _jsx(Link, { to: "/bugs", className: "text-xs text-accent underline", children: "See all \u2192" })] }), recent.isLoading ? (_jsx("div", { className: "p-5 space-y-2", children: Array.from({ length: 5 }).map((_, i) => _jsx(Skeleton, { className: "h-10 w-full" }, i)) })) : recent.data?.data.length === 0 ? (_jsx(EmptyState, { title: "No bugs yet", description: "Be the first to report one.", action: _jsx(Link, { to: "/bugs/new", className: "text-accent underline", children: "Report a bug \u2192" }) })) : (_jsx("ul", { className: "divide-y divide-default", children: recent.data?.data.map((b) => (_jsxs("li", { className: "flex items-center gap-3 px-5 py-3", children: [_jsx(Link, { to: `/bugs/${b.id}`, className: "flex-1 truncate font-display hover:underline", children: b.title }), _jsx(SeverityChip, { severity: b.severity }), _jsx(StatusBadge, { status: b.status })] }, b.id))) }))] })] }));
}
