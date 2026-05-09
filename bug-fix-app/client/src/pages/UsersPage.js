import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/hooks/use-users';
import { useMe } from '@/hooks/use-auth';
import { UserRow } from '@/components/admin/UserRow';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
export function UsersPage() {
    const me = useMe();
    const list = useUsers();
    const [editing, setEditing] = useState(null);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "font-display text-xl", children: "Users" }), _jsxs("div", { className: "rounded-xl border border-default bg-surface", children: [_jsxs("header", { className: "flex items-center gap-3 border-b border-default px-4 py-2 text-xs uppercase tracking-wider text-tertiary font-mono", children: [_jsx("span", { className: "flex-1", children: "User" }), _jsx("span", { className: "w-20", children: "Role" }), _jsx("span", { className: "w-24 truncate", children: "Team" }), _jsx("span", { className: "w-24 truncate", children: "Reports to" }), _jsx("span", { className: "w-24", children: "Joined" }), _jsx("span", { className: "w-28" })] }), list.isLoading ? (_jsx("div", { className: "p-4 space-y-2", children: Array.from({ length: 4 }).map((_, i) => _jsx(Skeleton, { className: "h-10 w-full" }, i)) })) : (_jsx("ul", { children: (list.data ?? []).map((u) => (_jsx(UserRow, { user: u, isSelf: u.id === me.data?.id, onChangeRole: () => setEditing(u) }, u.id))) }))] }), _jsx(RoleChangeDialog, { user: editing, open: !!editing, onOpenChange: (o) => !o && setEditing(null) })] }));
}
