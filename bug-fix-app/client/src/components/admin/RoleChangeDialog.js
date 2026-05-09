import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useChangeRole } from '@/hooks/use-users';
const ROLES = ['SUPERADMIN', 'TEAMLEAD', 'DEVELOPER', 'TESTER'];
const roleLabel = {
    SUPERADMIN: 'Superadmin',
    TEAMLEAD: 'Team Lead',
    DEVELOPER: 'Developer',
    TESTER: 'Tester',
};
export function RoleChangeDialog({ user, open, onOpenChange, }) {
    const [role, setRole] = useState(user?.role ?? 'TESTER');
    const change = useChangeRole();
    if (!user)
        return null;
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: ["Change role \u2014 ", user.name] }) }), _jsxs(Select, { value: role, onValueChange: (v) => setRole(v), children: [_jsx(SelectTrigger, { "aria-label": "New role", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: ROLES.map((r) => _jsx(SelectItem, { value: r, children: roleLabel[r] }, r)) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }), _jsx(Button, { disabled: change.isPending || role === user.role, onClick: async () => {
                                try {
                                    await change.mutateAsync({ id: user.id, role });
                                    toast.success('Role updated');
                                    onOpenChange(false);
                                }
                                catch {
                                    toast.error('Could not update role');
                                }
                            }, children: change.isPending ? 'Saving…' : 'Save' })] })] }) }));
}
