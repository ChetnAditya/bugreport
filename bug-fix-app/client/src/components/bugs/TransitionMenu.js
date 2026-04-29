import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { availableTransitions } from '@/lib/lifecycle-client';
import { AssigneeSelector } from './AssigneeSelector';
import { useTransitionBug } from '@/hooks/bugs/use-bugs';
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
export function TransitionMenu({ bug, role, currentUserId }) {
    const [pending, setPending] = useState(null);
    const [assigneeId, setAssigneeId] = useState();
    const [priority, setPriority] = useState();
    const transition = useTransitionBug(bug.id);
    const options = availableTransitions({
        currentStatus: bug.status,
        role,
        isAssignee: bug.assigneeId === currentUserId,
    });
    if (options.length === 0)
        return null;
    return (_jsxs(_Fragment, { children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "gap-2", children: ["Change status ", _jsx(ChevronDown, { className: "h-4 w-4" })] }) }), _jsx(DropdownMenuContent, { align: "end", children: options.map((o) => (_jsx(DropdownMenuItem, { onSelect: async () => {
                                if (o.needsAssignee || o.needsPriority) {
                                    setPending(o);
                                    return;
                                }
                                await runTransition(o);
                            }, children: o.label }, `${o.to}-${o.label}`))) })] }), _jsx(Dialog, { open: !!pending, onOpenChange: (o) => !o && setPending(null), children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: pending?.label }) }), _jsxs("div", { className: "space-y-3", children: [pending?.needsAssignee && (_jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-xs text-tertiary font-mono", children: "Assignee" }), _jsx(AssigneeSelector, { value: assigneeId, onChange: setAssigneeId })] })), pending?.needsPriority && (_jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: "text-xs text-tertiary font-mono", children: "Priority" }), _jsxs(Select, { value: priority, onValueChange: (v) => setPriority(v), children: [_jsx(SelectTrigger, { "aria-label": "Priority", children: _jsx(SelectValue, { placeholder: "Select priority" }) }), _jsx(SelectContent, { children: PRIORITIES.map((p) => _jsx(SelectItem, { value: p, children: p }, p)) })] })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setPending(null), children: "Cancel" }), _jsx(Button, { disabled: (pending?.needsAssignee && !assigneeId) ||
                                        (pending?.needsPriority && !priority) ||
                                        transition.isPending, onClick: async () => {
                                        if (!pending)
                                            return;
                                        await runTransition(pending);
                                        setPending(null);
                                    }, children: transition.isPending ? 'Updating…' : 'Confirm' })] })] }) })] }));
    async function runTransition(o) {
        try {
            await transition.mutateAsync({
                to: o.to,
                ...(o.needsAssignee && { assigneeId }),
                ...(o.needsPriority && { priority }),
            });
            toast.success(`Status → ${o.to}`);
        }
        catch {
            toast.error('Transition rejected');
        }
    }
}
