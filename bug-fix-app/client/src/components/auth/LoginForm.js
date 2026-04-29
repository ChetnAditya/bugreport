import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
});
export function LoginForm() {
    const login = useLogin();
    const nav = useNavigate();
    const loc = useLocation();
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, setFocus, } = useForm({ resolver: zodResolver(schema) });
    const onSubmit = handleSubmit(async (vals) => {
        setServerError(null);
        try {
            await login.mutateAsync(vals);
            const dest = loc.state?.from ?? '/dashboard';
            nav(dest, { replace: true });
        }
        catch (e) {
            const code = e
                .response?.data?.error;
            if (code?.code === 'UNAUTHORIZED')
                setServerError('Invalid credentials');
            else
                setServerError('Something went wrong. Try again.');
            setFocus('email');
        }
    });
    return (_jsxs("form", { onSubmit: onSubmit, noValidate: true, className: "space-y-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", autoComplete: "email", "aria-invalid": !!errors.email, ...register('email') }), errors.email && (_jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.email.message }))] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", autoComplete: "current-password", "aria-invalid": !!errors.password, ...register('password') }), errors.password && (_jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.password.message }))] }), serverError && (_jsx("p", { role: "alert", className: "rounded-md bg-elevated px-3 py-2 text-sm text-sev-critical", children: serverError })), _jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? 'Signing in...' : 'Sign in' }), _jsxs("p", { className: "text-xs text-secondary", children: ["New here?", ' ', _jsx(Link, { to: "/register", className: "text-accent underline", children: "Create an account" })] })] }));
}
