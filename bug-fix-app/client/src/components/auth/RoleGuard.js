import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useMe } from '@/hooks/use-auth';
export function RoleGuard({ allow, children }) {
    const me = useMe();
    if (me.isLoading)
        return null;
    if (!me.data)
        return _jsx(Navigate, { to: "/login", replace: true });
    // SUPERADMIN supersedes ADMIN for backward compat
    const userRole = me.data.role;
    if (userRole === 'SUPERADMIN')
        return _jsx(_Fragment, { children: children });
    if (!allow.includes(userRole))
        return _jsx(Navigate, { to: "/403", replace: true });
    return _jsx(_Fragment, { children: children });
}
