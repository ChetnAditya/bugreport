import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDirectReports } from '@/hooks/use-org-chart';
import { useMe } from '@/hooks/use-auth';
import { ChevronRight, Users } from 'lucide-react';
const roleLabel = {
    SUPERADMIN: 'Superadmin',
    TEAMLEAD: 'Lead',
    DEVELOPER: 'Developer',
    TESTER: 'Tester',
};
function ReportTree({ userId, depth = 0 }) {
    const reports = useDirectReports(userId);
    if (reports.isLoading) {
        return _jsx(Skeleton, { className: "h-8 w-48" });
    }
    if (!reports.data || reports.data.length === 0)
        return null;
    return (_jsx("ul", { className: "pl-6 border-l border-border", children: reports.data.map((r) => (_jsxs("li", { className: "py-1", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("span", { className: "text-tertiary", children: _jsx(ChevronRight, { className: "h-3 w-3" }) }), _jsx("span", { className: "font-display text-sm truncate", children: r.name }), _jsx(Badge, { variant: "outline", className: "text-xs shrink-0", children: roleLabel[r.role] ?? r.role })] }) }), _jsx(ReportTree, { userId: r.id, depth: depth + 1 })] }, r.id))) }));
}
export function OrgChartPage() {
    const me = useMe();
    const isLead = me.data?.role === 'TEAMLEAD' || me.data?.role === 'SUPERADMIN';
    if (!isLead) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-center", children: [_jsx(Users, { className: "h-12 w-12 text-tertiary mb-4" }), _jsx("h1", { className: "font-display text-xl mb-2", children: "Org Chart" }), _jsx("p", { className: "text-secondary text-sm", children: "Only leads and admins can view the org chart." })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "font-display text-xl", children: "Org Chart" }), _jsxs("div", { className: "rounded-xl border border-default bg-surface p-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "font-display text-sm", children: me.data?.name }), _jsx(Badge, { variant: "outline", children: roleLabel[me.data?.role ?? ''] ?? me.data?.role }), me.data?.team && _jsxs("span", { className: "text-xs text-tertiary", children: ["\u00B7 ", me.data.team.name] })] }), _jsx(ReportTree, { userId: me.data.id })] })] }));
}
