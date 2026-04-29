import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export function NotFoundPage() {
    return (_jsxs("main", { className: "mx-auto max-w-xl px-6 py-24", children: [_jsx("h1", { className: "font-display text-2xl mb-2", children: "404 \u2014 Not found" }), _jsx(Link, { to: "/dashboard", className: "text-accent underline", children: "Back to dashboard" })] }));
}
