import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
export function AssigneeSelector({ value, onChange, teamId, }) {
    const devs = useQuery({
        queryKey: ['users', 'developers', teamId ?? null],
        queryFn: async () => {
            const params = { role: 'DEVELOPER' };
            if (teamId)
                params.teamId = teamId;
            const { data } = await api.get('/api/users', { params });
            return data.data;
        },
        enabled: true,
    });
    return (_jsxs(Select, { value: value, onValueChange: onChange, children: [_jsx(SelectTrigger, { "aria-label": "Assignee", children: _jsx(SelectValue, { placeholder: "Select developer" }) }), _jsxs(SelectContent, { children: [(devs.data ?? []).map((u) => (_jsxs(SelectItem, { value: u.id, children: [u.name, " \u00B7 ", u.email] }, u.id))), (devs.data ?? []).length === 0 && (_jsx(SelectItem, { value: "__none__", disabled: true, children: "No developers available" }))] })] }));
}
