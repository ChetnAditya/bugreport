import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
const keys = {
    list: (role) => ['users', 'list', role ?? null],
};
export function useUsers(role) {
    return useQuery({
        queryKey: keys.list(role),
        queryFn: async () => {
            const { data } = await api.get('/api/users', {
                params: role ? { role } : undefined,
            });
            return data.data;
        },
    });
}
export function useChangeRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role }) => {
            const { data } = await api.patch(`/api/users/${id}/role`, { role });
            return data.user;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
    });
}
