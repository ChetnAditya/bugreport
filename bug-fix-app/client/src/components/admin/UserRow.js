import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
const roleLabel = {
    SUPERADMIN: 'Superadmin',
    TEAMLEAD: 'Lead',
    DEVELOPER: 'Developer',
    TESTER: 'Tester',
};
export function UserRow({ user, onChangeRole, isSelf, }) {
    return (_jsxs("li", { className: "flex items-center gap-3 border-b border-default px-4 py-3 min-h-[56px]", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "truncate font-display text-sm", children: user.name }), _jsx("p", { className: "truncate text-xs text-tertiary", children: user.email })] }), _jsx("span", { className: "font-mono text-xs px-2 py-0.5 rounded bg-surface-secondary", children: roleLabel[user.role] }), user.team && (_jsx("span", { className: "text-xs text-tertiary truncate max-w-[100px]", children: user.team.name })), user.directManager && (_jsxs("span", { className: "text-xs text-tertiary truncate max-w-[100px]", children: ["\u21B3 ", user.directManager.name] })), _jsx("span", { className: "font-mono text-xs text-tertiary shrink-0", children: format(new Date(user.createdAt), 'PP') }), _jsx(Button, { size: "sm", variant: "outline", onClick: onChangeRole, disabled: isSelf, children: "Change role" })] }));
}
