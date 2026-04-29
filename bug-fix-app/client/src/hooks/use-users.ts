import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Role, User } from '@/types/domain';

const keys = {
  list: (role?: Role) => ['users', 'list', role ?? null] as const,
};

export function useUsers(role?: Role) {
  return useQuery({
    queryKey: keys.list(role),
    queryFn: async () => {
      const { data } = await api.get<{ data: User[] }>('/api/users', {
        params: role ? { role } : undefined,
      });
      return data.data;
    },
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { data } = await api.patch<{ user: User }>(`/api/users/${id}/role`, { role });
      return data.user;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
