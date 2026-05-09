import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useBug, useUpdateBug } from '@/hooks/bugs/use-bugs';
import { useMe } from '@/hooks/use-auth';
const schema = z.object({
    title: z.string().min(3).max(140),
    description: z.string().min(10).max(5000),
    stepsToReproduce: z.string().min(5).max(2000),
});
export function BugEditPage() {
    const { id } = useParams();
    const me = useMe();
    const bug = useBug(id);
    const update = useUpdateBug(id ?? '');
    const nav = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(schema),
        values: bug.data && {
            title: bug.data.title,
            description: bug.data.description,
            stepsToReproduce: bug.data.stepsToReproduce,
        },
    });
    if (bug.isLoading || !me.data)
        return _jsx(Skeleton, { className: "h-40 w-full" });
    if (!bug.data)
        return _jsx("p", { children: "Not found." });
    const isReporter = bug.data.reporterId === me.data.id;
    const isAdmin = me.data.role === 'SUPERADMIN';
    const canEdit = (isReporter || isAdmin) && bug.data.status === 'NEW';
    if (!canEdit) {
        return (_jsxs("p", { className: "text-secondary", children: ["This bug can no longer be edited.", ' ', _jsx(Link, { to: `/bugs/${bug.data.id}`, className: "text-accent underline", children: "Back" })] }));
    }
    const onSubmit = handleSubmit(async (vals) => {
        try {
            await update.mutateAsync(vals);
            toast.success('Bug updated');
            nav(`/bugs/${bug.data.id}`);
        }
        catch {
            toast.error('Could not update');
        }
    });
    return (_jsxs("form", { onSubmit: onSubmit, className: "space-y-4 max-w-2xl", children: [_jsx("h1", { className: "font-display text-xl", children: "Edit bug" }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", ...register('title'), "aria-invalid": !!errors.title }), errors.title && _jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.title.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", rows: 5, ...register('description'), "aria-invalid": !!errors.description }), errors.description && _jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.description.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "stepsToReproduce", children: "Steps to reproduce" }), _jsx(Textarea, { id: "stepsToReproduce", rows: 6, ...register('stepsToReproduce'), "aria-invalid": !!errors.stepsToReproduce }), errors.stepsToReproduce && _jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.stepsToReproduce.message })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Link, { to: `/bugs/${bug.data.id}`, children: _jsx(Button, { type: "button", variant: "outline", children: "Cancel" }) }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Saving…' : 'Save changes' })] })] }));
}
