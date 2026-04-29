import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export function ForbiddenPage() {
    return (_jsxs("main", { className: "mx-auto max-w-xl px-6 py-24", children: [_jsx("h1", { className: "font-display text-2xl mb-2", children: "403 \u2014 Forbidden" }), _jsx("p", { className: "text-secondary mb-6", children: "You don't have permission to view this page." }), _jsx(Link, { to: "/dashboard", className: "text-accent underline", children: "Back to dashboard" })] }));
}
