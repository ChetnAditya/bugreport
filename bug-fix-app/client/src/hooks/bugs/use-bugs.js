import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
const keys = {
    list: (f) => ['bugs', 'list', f],
    detail: (id) => ['bugs', 'detail', id],
};
export function useBugList(filter) {
    return useQuery({
        queryKey: keys.list(filter),
        queryFn: async () => {
            const { data } = await api.get('/api/bugs', { params: filter });
            return data;
        },
        placeholderData: (prev) => prev,
    });
}
export function useBug(id) {
    return useQuery({
        queryKey: keys.detail(id ?? '_'),
        enabled: !!id,
        queryFn: async () => {
            const { data } = await api.get(`/api/bugs/${id}`);
            return data.bug;
        },
    });
}
export function useCreateBug() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input) => {
            const { data } = await api.post('/api/bugs', input);
            return data.bug;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bugs'] }),
    });
}
export function useUpdateBug(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input) => {
            const { data } = await api.patch(`/api/bugs/${id}`, input);
            return data.bug;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.detail(id) });
            qc.invalidateQueries({ queryKey: ['bugs', 'list'] });
        },
    });
}
export function useDeleteBug() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/api/bugs/${id}`);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bugs'] }),
    });
}
export function useTransitionBug(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (input) => {
            const { data } = await api.post(`/api/bugs/${id}/transition`, input);
            return data.bug;
        },
        onMutate: async (input) => {
            await qc.cancelQueries({ queryKey: keys.detail(id) });
            const prev = qc.getQueryData(keys.detail(id));
            if (prev)
                qc.setQueryData(keys.detail(id), { ...prev, status: input.to });
            return { prev };
        },
        onError: (_e, _i, ctx) => {
            if (ctx?.prev)
                qc.setQueryData(keys.detail(id), ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: keys.detail(id) });
            qc.invalidateQueries({ queryKey: ['bugs', 'list'] });
        },
    });
}
export function useAddScreenshots(id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (urls) => {
            const { data } = await api.post(`/api/bugs/${id}/screenshots`, { urls });
            return data.bug;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(id) }),
    });
}
