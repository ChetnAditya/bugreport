import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Team } from '@/types/domain';

const keys = {
  list: () => ['teams'] as const,
  detail: (id: string) => ['teams', id] as const,
  members: (id: string) => ['teams', id, 'members'] as const,
};

export function useTeams() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const { data } = await api.get<{ data: Team[] }>('/api/teams');
      return data.data;
    },
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: Team }>(`/api/teams/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useTeamMembers(id: string) {
  return useQuery({
    queryKey: keys.members(id),
    queryFn: async () => {
      const { data } = await api.get<{ data: import('@/types/domain').User[] }>(
        `/api/teams/${id}/members`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data } = await api.post<{ data: Team }>('/api/teams', input);
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
    mutationFn: async (id: string) => {
      await api.delete(`/api/teams/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
