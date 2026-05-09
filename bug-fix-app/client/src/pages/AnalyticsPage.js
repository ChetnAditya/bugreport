import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useStatsSummary, useDeveloperStats } from '@/hooks/use-stats';
import { KpiCard } from '@/components/common/KpiCard';
const BugStatusChart = lazy(() => import('@/components/analytics/BugStatusChart').then((m) => ({ default: m.BugStatusChart })));
const SeverityDonut = lazy(() => import('@/components/analytics/SeverityDonut').then((m) => ({ default: m.SeverityDonut })));
const DeveloperLeaderboard = lazy(() => import('@/components/analytics/DeveloperLeaderboard').then((m) => ({
    default: m.DeveloperLeaderboard,
})));
export function AnalyticsPage() {
    const summary = useStatsSummary();
    const devs = useDeveloperStats();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "font-display text-xl", children: "Analytics" }), _jsxs("section", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [_jsx(KpiCard, { label: "Total", value: summary.data?.total ?? _jsx(Skeleton, { className: "h-8 w-12" }) }), _jsx(KpiCard, { label: "Open", value: (summary.data?.byStatus.NEW ?? 0) + (summary.data?.byStatus.ASSIGNED ?? 0) + (summary.data?.byStatus.IN_PROGRESS ?? 0) }), _jsx(KpiCard, { label: "Fixed", value: summary.data?.byStatus.FIXED ?? 0 }), _jsx(KpiCard, { label: "Closed", value: summary.data?.byStatus.CLOSED ?? 0 })] }), _jsxs("section", { className: "grid gap-4 md:grid-cols-2", children: [_jsx(Suspense, { fallback: _jsx(Skeleton, { className: "h-72 w-full" }), children: summary.data && _jsx(BugStatusChart, { data: summary.data.byStatus }) }), _jsx(Suspense, { fallback: _jsx(Skeleton, { className: "h-72 w-full" }), children: summary.data && _jsx(SeverityDonut, { data: summary.data.bySeverity }) })] }), _jsx(Suspense, { fallback: _jsx(Skeleton, { className: "h-48 w-full" }), children: devs.data && _jsx(DeveloperLeaderboard, { rows: devs.data }) })] }));
}
