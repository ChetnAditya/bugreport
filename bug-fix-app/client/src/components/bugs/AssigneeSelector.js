import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
export function AssigneeSelector({ value, onChange, }) {
    const devs = useQuery({
        queryKey: ['users', 'developers'],
        queryFn: async () => {
            const { data } = await api.get('/api/users?role=DEVELOPER');
            return data.data;
        },
    });
    return (_jsxs(Select, { value: value, onValueChange: onChange, children: [_jsx(SelectTrigger, { "aria-label": "Assignee", children: _jsx(SelectValue, { placeholder: "Select developer" }) }), _jsx(SelectContent, { children: (devs.data ?? []).map((u) => (_jsxs(SelectItem, { value: u.id, children: [u.name, " \u00B7 ", u.email] }, u.id))) })] }));
}
