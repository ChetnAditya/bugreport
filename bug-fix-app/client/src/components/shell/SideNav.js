import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bug, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/use-auth';
const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'all' },
    { to: '/bugs', label: 'Bugs', icon: Bug, role: 'all' },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, role: 'admin' },
    { to: '/users', label: 'Users', icon: Users, role: 'admin' },
];
export function SideNav() {
    const me = useMe();
    const isAdmin = me.data?.role === 'ADMIN';
    return (_jsx("nav", { "aria-label": "Primary", className: "hidden md:flex w-60 shrink-0 flex-col border-r border-default bg-surface", children: _jsx("ul", { className: "flex flex-col gap-1 p-3", children: items
                .filter((i) => i.role !== 'admin' || isAdmin)
                .map((i) => (_jsx("li", { children: _jsxs(NavLink, { to: i.to, className: ({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-display', 'min-h-[44px]', isActive
                        ? 'bg-elevated text-primary'
                        : 'text-secondary hover:bg-elevated hover:text-primary'), children: [_jsx(i.icon, { className: "h-4 w-4", "aria-hidden": true }), " ", i.label] }) }, i.to))) }) }));
}
