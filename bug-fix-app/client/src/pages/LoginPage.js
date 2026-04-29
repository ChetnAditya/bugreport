import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LoginForm } from '@/components/auth/LoginForm';
export function LoginPage() {
    return (_jsx("main", { className: "mx-auto flex min-h-screen max-w-md items-center px-6", children: _jsxs("section", { className: "w-full rounded-xl border border-default bg-surface p-8", children: [_jsx("h1", { className: "font-display text-xl mb-1", children: "Sign in" }), _jsx("p", { className: "text-secondary text-sm mb-6", children: "Field Report \u2014 bug tracker" }), _jsx(LoginForm, {})] }) }));
}
