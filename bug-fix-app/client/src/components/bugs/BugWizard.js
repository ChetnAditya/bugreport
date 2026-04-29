import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScreenshotDrop } from './ScreenshotDrop';
import { useCreateBug, useAddScreenshots } from '@/hooks/bugs/use-bugs';
import { useCloudinaryUpload } from '@/hooks/bugs/use-cloudinary-upload';
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const step1 = z.object({
    title: z.string().min(3, 'Min 3 characters').max(140),
    description: z.string().min(10, 'Min 10 characters').max(5000),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});
const step2 = z.object({
    stepsToReproduce: z.string().min(5, 'Min 5 characters').max(2000),
});
export function BugWizard() {
    const [step, setStep] = useState(1);
    const [vals, setVals] = useState({});
    const [files, setFiles] = useState([]);
    const create = useCreateBug();
    const nav = useNavigate();
    const [createdBugId, setCreatedBugId] = useState(null);
    const upload = useCloudinaryUpload(createdBugId ?? 'pending');
    const attach = useAddScreenshots(createdBugId ?? 'pending');
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("ol", { className: "flex items-center gap-2 text-xs font-mono", "aria-label": "Steps", children: [1, 2, 3].map((s) => (_jsxs("li", { className: s === step
                        ? 'rounded-md bg-accent px-2 py-1 text-base font-semibold'
                        : 'rounded-md border border-default px-2 py-1 text-tertiary', children: ["Step ", s] }, s))) }), step === 1 && (_jsx(Step1, { defaults: vals, onNext: (v) => {
                    setVals({ ...vals, ...v });
                    setStep(2);
                } })), step === 2 && (_jsx(Step2, { defaults: vals, onBack: () => setStep(1), onNext: (v) => {
                    setVals({ ...vals, ...v });
                    setStep(3);
                } })), step === 3 && (_jsx(Step3, { files: files, setFiles: setFiles, onBack: () => setStep(2), onSubmit: async () => {
                    try {
                        const bug = await create.mutateAsync({
                            title: vals.title,
                            description: vals.description,
                            stepsToReproduce: vals.stepsToReproduce,
                            severity: vals.severity,
                        });
                        setCreatedBugId(bug.id);
                        if (files.length > 0) {
                            const urls = [];
                            for (const f of files)
                                urls.push(await upload.uploadFile(f.file));
                            await attach.mutateAsync(urls);
                        }
                        toast.success('Bug submitted');
                        nav(`/bugs/${bug.id}`);
                    }
                    catch {
                        toast.error('Could not submit bug');
                    }
                }, submitting: create.isPending }))] }));
}
function Step1({ defaults, onNext, }) {
    const { register, handleSubmit, setValue, watch, formState: { errors }, } = useForm({ resolver: zodResolver(step1), defaultValues: defaults });
    const sev = watch('severity');
    return (_jsxs("form", { className: "space-y-4", onSubmit: handleSubmit(onNext), children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "title", children: "Title" }), _jsx(Input, { id: "title", ...register('title'), "aria-invalid": !!errors.title }), errors.title && _jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.title.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Textarea, { id: "description", rows: 5, ...register('description'), "aria-invalid": !!errors.description }), errors.description && _jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.description.message })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "severity", children: "Severity" }), _jsxs(Select, { value: sev, onValueChange: (v) => setValue('severity', v), children: [_jsx(SelectTrigger, { id: "severity", "aria-label": "Severity", children: _jsx(SelectValue, { placeholder: "Choose severity" }) }), _jsx(SelectContent, { children: SEVERITIES.map((s) => _jsx(SelectItem, { value: s, children: s }, s)) })] }), errors.severity && _jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.severity.message })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", children: "Next" }) })] }));
}
function Step2({ defaults, onNext, onBack, }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(step2),
        defaultValues: defaults,
    });
    return (_jsxs("form", { className: "space-y-4", onSubmit: handleSubmit(onNext), children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "stepsToReproduce", children: "Steps to reproduce" }), _jsx(Textarea, { id: "stepsToReproduce", rows: 6, ...register('stepsToReproduce'), "aria-invalid": !!errors.stepsToReproduce }), errors.stepsToReproduce && _jsx("p", { role: "alert", className: "text-xs text-sev-critical", children: errors.stepsToReproduce.message })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onBack, children: "Back" }), _jsx(Button, { type: "submit", children: "Next" })] })] }));
}
function Step3({ files, setFiles, onBack, onSubmit, submitting, }) {
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(ScreenshotDrop, { files: files, onChange: setFiles }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onBack, children: "Back" }), _jsx(Button, { type: "button", onClick: onSubmit, disabled: submitting, children: submitting ? 'Submitting...' : 'Submit bug' })] })] }));
}
