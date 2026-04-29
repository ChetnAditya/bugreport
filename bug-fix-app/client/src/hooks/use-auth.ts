import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/domain';

const ME_KEY = ['auth', 'me'] as const;

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get<{ user: User }>('/api/auth/me');
        setUser(data.user);
        return data.user;
      } catch {
        setUser(null);
        throw new Error('Unauthorized');
      }
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<{ user: User }>('/api/auth/login', input);
      return data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      const { data } = await api.post<{ user: User }>('/api/auth/register', input);
      return data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      qc.setQueryData(ME_KEY, null);
    },
  });
}
