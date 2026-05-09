import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTeam, useTeamMembers } from '@/hooks/use-teams';
import { useMe } from '@/hooks/use-auth';
import { format } from 'date-fns';
const roleLabel = {
    SUPERADMIN: 'Superadmin',
    TEAMLEAD: 'Lead',
    DEVELOPER: 'Developer',
    TESTER: 'Tester',
};
export function TeamDetailPage() {
    const { id } = useParams();
    const me = useMe();
    const team = useTeam(id ?? '');
    const members = useTeamMembers(id ?? '');
    const isMember = me.data?.teamId === id;
    const canManage = me.data?.role === 'SUPERADMIN';
    if (team.isLoading || members.isLoading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsx(Skeleton, { className: "h-32 w-full" })] }));
    }
    if (!team.data) {
        return _jsx("p", { className: "text-secondary", children: "Team not found." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-xl", children: team.data.name }), team.data.description && (_jsx("p", { className: "text-sm text-tertiary mt-1", children: team.data.description })), _jsxs("p", { className: "text-xs text-tertiary mt-1", children: ["Created ", format(new Date(team.data.createdAt), 'PP')] })] }), canManage && (_jsx(Link, { to: `/teams/${id}/settings`, children: _jsx("button", { className: "text-xs text-accent underline", children: "Edit team" }) }))] }), _jsxs("section", { children: [_jsxs("h2", { className: "font-display text-base mb-3", children: ["Members (", members.data?.length ?? 0, ")"] }), _jsx("div", { className: "rounded-xl border border-default bg-surface", children: members.isLoading ? (_jsx("div", { className: "p-4 space-y-2", children: [1, 2, 3].map((i) => (_jsx(Skeleton, { className: "h-10 w-full" }, i))) })) : members.data?.length === 0 ? (_jsx("p", { className: "p-6 text-center text-tertiary", children: "No members." })) : (_jsx("ul", { children: (members.data ?? []).map((m) => (_jsxs("li", { className: "flex items-center justify-between border-b border-default px-4 py-3 last:border-0", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate font-display text-sm", children: m.name }), _jsx("p", { className: "truncate text-xs text-tertiary", children: m.email })] }), _jsx(Badge, { variant: "outline", children: roleLabel[m.role] ?? m.role })] }, m.id))) })) })] })] }));
}
