import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bug, BarChart3, Users, UsersRound, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/use-auth';
const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, lead: false, superadmin: false },
    { to: '/bugs', label: 'Bugs', icon: Bug, lead: false, superadmin: false },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, lead: true, superadmin: false },
    { to: '/org-chart', label: 'Org Chart', icon: Network, lead: true, superadmin: false },
    { to: '/users', label: 'Users', icon: Users, lead: false, superadmin: true },
    { to: '/teams', label: 'Teams', icon: UsersRound, lead: false, superadmin: true },
];
export function SideNav() {
    const me = useMe();
    const isLead = me.data?.role === 'SUPERADMIN' || me.data?.role === 'TEAMLEAD';
    const isSuperadmin = me.data?.role === 'SUPERADMIN';
    return (_jsx("nav", { "aria-label": "Primary", className: "hidden md:flex w-60 shrink-0 flex-col border-r border-default bg-surface", children: _jsx("ul", { className: "flex flex-col gap-1 p-3", children: items
                .filter((i) => (!i.lead || isLead) && (!i.superadmin || isSuperadmin))
                .map((i) => (_jsx("li", { children: _jsxs(NavLink, { to: i.to, className: ({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-display', 'min-h-[44px]', isActive
                        ? 'bg-elevated text-primary'
                        : 'text-secondary hover:bg-elevated hover:text-primary'), children: [_jsx(i.icon, { className: "h-4 w-4", "aria-hidden": true }), " ", i.label] }) }, i.to))) }) }));
}
