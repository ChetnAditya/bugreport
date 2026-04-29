import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types/domain';

export function useDirectReports(userId: string) {
  return useQuery({
    queryKey: ['users', userId, 'reports'],
    queryFn: async () => {
      const { data } = await api.get<{ data: User[] }>(`/api/users/${userId}/reports`);
      return data.data;
    },
    enabled: !!userId,
  });
}

export function useAssignTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, teamId }: { userId: string; teamId: string | null }) => {
      const { data } = await api.patch<{ user: User }>(`/api/users/${userId}/team`, { teamId });
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
    mutationFn: async ({ userId, managerId }: { userId: string; managerId: string | null }) => {
      const { data } = await api.patch<{ user: User }>(`/api/users/${userId}/manager`, { managerId });
      return data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
