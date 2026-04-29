import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
const schema = z.object({
    name: z.string().min(1, 'Name required').max(80),
    email: z.string().email('Enter a valid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Za-z]/, 'Must contain a letter')
        .regex(/[0-9]/, 'Must contain a number'),
});
export function RegisterForm() {
    const reg = useRegister();
    const nav = useNavigate();
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({ resolver: zodResolver(schema), mode: 'onBlur' });
    const onSubmit = handleSubmit(async (vals) => {
        setServerError(null);
        try {
            await reg.mutateAsync(vals);
            nav('/dashboard', { replace: true });
        }
        catch (e) {
            const err = e
                .response?.data?.error;
            setServerError(err?.code === 'CONFLICT' ? 'Email already registered' : 'Something went wrong');
        }
    });
    return (_jsxs("form", { onSubmit: onSubmit, noValidate: true, className: "space-y-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", autoComplete: "name", "aria-invalid": !!errors.name, ...register('name') }), errors.name && (_jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.name.message }))] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", autoComplete: "email", "aria-invalid": !!errors.email, ...register('email') }), errors.email && (_jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.email.message }))] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", autoComplete: "new-password", "aria-invalid": !!errors.password, ...register('password') }), errors.password && (_jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.password.message }))] }), serverError && (_jsx("p", { role: "alert", className: "rounded-md bg-elevated px-3 py-2 text-sm text-sev-critical", children: serverError })), _jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? 'Creating...' : 'Create account' }), _jsxs("p", { className: "text-xs text-secondary", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "text-accent underline", children: "Sign in" })] })] }));
}
