import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
export function AuthGuard({ children }) {
    const me = useMe();
    const loc = useLocation();
    if (me.isLoading) {
        return (_jsx("div", { className: "p-8", "aria-live": "polite", children: _jsx(Skeleton, { className: "h-8 w-48" }) }));
    }
    if (me.isError || !me.data) {
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: loc.pathname } });
    }
    return _jsx(_Fragment, { children: children });
}
