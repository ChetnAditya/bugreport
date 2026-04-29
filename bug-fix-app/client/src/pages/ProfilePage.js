import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export function ProfilePage() {
    const me = useMe();
    if (!me.data)
        return null;
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h1", { className: "font-display text-xl", children: "Profile" }), _jsxs(Card, { className: "bg-surface border-default", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "font-display text-base", children: me.data.name }) }), _jsxs(CardContent, { className: "text-secondary text-sm space-y-1", children: [_jsx("p", { children: me.data.email }), _jsxs("p", { className: "font-mono text-xs", children: ["role: ", me.data.role] }), _jsxs("p", { className: "font-mono text-xs", children: ["id: ", me.data.id] })] })] })] }));
}
