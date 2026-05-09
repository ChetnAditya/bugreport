import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function useDirectReports(userId) {
    return useQuery({
        queryKey: ['users', userId, 'reports'],
        queryFn: async () => {
            const { data } = await api.get(`/api/users/${userId}/reports`);
            return data.data;
        },
        enabled: !!userId,
    });
}
export function useAssignTeam() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, teamId }) => {
            const { data } = await api.patch(`/api/users/${userId}/team`, { teamId });
            return data.user;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
export function useSetManager() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, managerId }) => {
            const { data } = await api.patch(`/api/users/${userId}/manager`, { managerId });
            return data.user;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
