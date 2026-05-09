import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
export function useStatsSummary() {
    return useQuery({
        queryKey: ['stats', 'summary'],
        queryFn: async () => {
            const { data } = await api.get('/api/stats/summary');
            return data;
        },
    });
}
export function useDeveloperStats() {
    return useQuery({
        queryKey: ['stats', 'developers'],
        queryFn: async () => {
            const { data } = await api.get('/api/stats/developers');
            return data.data;
        },
    });
}
