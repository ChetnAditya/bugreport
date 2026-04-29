import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useMe } from '@/hooks/use-auth';
export function RoleGuard({ allow, children }) {
    const me = useMe();
    if (me.isLoading)
        return null;
    if (!me.data)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (!allow.includes(me.data.role))
        return _jsx(Navigate, { to: "/403", replace: true });
    return _jsx(_Fragment, { children: children });
}
