import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
const keys = {
    list: () => ['teams'],
    detail: (id) => ['teams', id],
    members: (id) => ['teams', id, 'members'],
};
export function useTeams() {
    return useQuery({
        queryKey: keys.list(),
        queryFn: async () => {
            const { data } = await api.get('/api/teams');
            return data.data;
        },
    });
}
export function useTeam(id) {
    return useQuery({
        queryKey: keys.detail(id),
        queryFn: async () => {
            const { data } = await api.get(`/api/teams/${id}`);
            return data.data;
        },
        enabled: !!id,
    });
}
export function useTeamMembers(id) {
    return useQuery({
        queryKey: keys.members(id),
        queryFn: async () => {
            const { data } = await api.get(`/api/teams/${id}/members`);
            return data.data;
        },
        enabled: !!id,
    });
}
export function useCreateTeam() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input) => {
            const { data } = await api.post('/api/teams', input);
            return data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['teams'] });
        },
    });
}
export function useDeleteTeam() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/api/teams/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['teams'] });
        },
    });
}
