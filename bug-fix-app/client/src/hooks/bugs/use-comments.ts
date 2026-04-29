import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Comment } from '@/types/domain';

const key = (bugId: string) => ['bugs', 'comments', bugId] as const;

export function useComments(bugId: string) {
  return useQuery({
    queryKey: key(bugId),
    queryFn: async () => {
      const { data } = await api.get<{ data: Comment[] }>(`/api/bugs/${bugId}/comments`);
      return data.data;
    },
  });
}

export function useCreateComment(bugId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<{ comment: Comment }>(`/api/bugs/${bugId}/comments`, { text });
      return data.comment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
  });
}

export function useUpdateComment(bugId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.patch<{ comment: Comment }>(`/api/comments/${id}`, { text });
      return data.comment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
  });
}

export function useDeleteComment(bugId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/api/comments/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
  });
}
