import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bug, LogOut, Search, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/hooks/use-auth';
export function TopBar({ onSearch }) {
    const me = useMe();
    const logout = useLogout();
    const nav = useNavigate();
    return (_jsx("header", { className: "sticky top-0 z-30 h-14 border-b border-default bg-surface/80 backdrop-blur", children: _jsxs("div", { className: "flex h-full items-center gap-3 px-4", children: [_jsx(Bug, { className: "h-5 w-5 text-accent", "aria-hidden": true }), _jsx("span", { className: "font-display text-base", children: "Field Report" }), _jsxs("button", { type: "button", onClick: onSearch, className: "ml-auto flex h-9 items-center gap-2 rounded-md border border-default bg-base px-3 text-sm text-secondary hover:text-primary", "aria-label": "Search bugs", children: [_jsx(Search, { className: "h-4 w-4", "aria-hidden": true }), " Search ", _jsx("kbd", { className: "ml-2 text-xs", children: "\u2318K" })] }), _jsx(Button, { variant: "ghost", size: "icon", "aria-label": "Profile", onClick: () => nav('/profile'), children: _jsx(UserIcon, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", "aria-label": "Sign out", onClick: async () => {
                        await logout.mutateAsync();
                        nav('/login');
                    }, disabled: !me.data, children: _jsx(LogOut, { className: "h-4 w-4" }) })] }) }));
}
