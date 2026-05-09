import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from '@/components/ui/command';
import { LayoutDashboard, Bug, Plus, BarChart3, Users, User } from 'lucide-react';
import { useMe } from '@/hooks/use-auth';
export function CommandPalette({ open, onOpenChange }) {
    const nav = useNavigate();
    const me = useMe();
    const isAdmin = me.data?.role === 'SUPERADMIN';
    const canCreate = me.data?.role === 'SUPERADMIN' || me.data?.role === 'TESTER';
    const go = (path) => {
        onOpenChange(false);
        nav(path);
    };
    return (_jsxs(CommandDialog, { open: open, onOpenChange: onOpenChange, children: [_jsx(CommandInput, { placeholder: "Type a command or search..." }), _jsxs(CommandList, { children: [_jsx(CommandEmpty, { children: "No results." }), _jsxs(CommandGroup, { heading: "Navigation", children: [_jsxs(CommandItem, { onSelect: () => go('/dashboard'), children: [_jsx(LayoutDashboard, { className: "mr-2 h-4 w-4" }), " Dashboard"] }), _jsxs(CommandItem, { onSelect: () => go('/bugs'), children: [_jsx(Bug, { className: "mr-2 h-4 w-4" }), " Bugs"] }), _jsxs(CommandItem, { onSelect: () => go('/profile'), children: [_jsx(User, { className: "mr-2 h-4 w-4" }), " Profile"] }), isAdmin && (_jsxs(_Fragment, { children: [_jsxs(CommandItem, { onSelect: () => go('/analytics'), children: [_jsx(BarChart3, { className: "mr-2 h-4 w-4" }), " Analytics"] }), _jsxs(CommandItem, { onSelect: () => go('/users'), children: [_jsx(Users, { className: "mr-2 h-4 w-4" }), " Users"] })] }))] }), canCreate && (_jsx(CommandGroup, { heading: "Actions", children: _jsxs(CommandItem, { onSelect: () => go('/bugs/new'), children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), " New bug"] }) }))] })] }));
}
export function useCommandPaletteHotkey(setOpen) {
    useEffect(() => {
        function onKey(e) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(true);
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [setOpen]);
}
