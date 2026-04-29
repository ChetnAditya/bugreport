import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
const key = (bugId) => ['bugs', 'comments', bugId];
export function useComments(bugId) {
    return useQuery({
        queryKey: key(bugId),
        queryFn: async () => {
            const { data } = await api.get(`/api/bugs/${bugId}/comments`);
            return data.data;
        },
    });
}
export function useCreateComment(bugId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (text) => {
            const { data } = await api.post(`/api/bugs/${bugId}/comments`, { text });
            return data.comment;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
    });
}
export function useUpdateComment(bugId, id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (text) => {
            const { data } = await api.patch(`/api/comments/${id}`, { text });
            return data.comment;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
    });
}
export function useDeleteComment(bugId, id) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await api.delete(`/api/comments/${id}`);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
    });
}
