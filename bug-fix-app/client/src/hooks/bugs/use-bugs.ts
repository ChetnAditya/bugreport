import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Bug,
  BugStatus,
  Severity,
  Priority,
} from '@/types/domain';

export interface BugListResponse {
  data: Bug[];
  total: number;
  page: number;
  limit: number;
}

export interface BugListFilter {
  status?: BugStatus;
  severity?: Severity;
  priority?: Priority;
  assigneeId?: string;
  teamId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

const keys = {
  list: (f: BugListFilter) => ['bugs', 'list', f] as const,
  detail: (id: string) => ['bugs', 'detail', id] as const,
};

export function useBugList(filter: BugListFilter) {
  return useQuery({
    queryKey: keys.list(filter),
    queryFn: async () => {
      const { data } = await api.get<BugListResponse>('/api/bugs', { params: filter });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useBug(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? '_'),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ bug: Bug }>(`/api/bugs/${id}`);
      return data.bug;
    },
  });
}

export interface CreateBugInput {
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  screenshots?: string[];
}

export function useCreateBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBugInput) => {
      const { data } = await api.post<{ bug: Bug }>('/api/bugs', input);
      return data.bug;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bugs'] }),
  });
}

export function useUpdateBug(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pick<Bug, 'title' | 'description' | 'stepsToReproduce'>>) => {
      const { data } = await api.patch<{ bug: Bug }>(`/api/bugs/${id}`, input);
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
    mutationFn: async (id: string) => {
      await api.delete(`/api/bugs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bugs'] }),
  });
}

export function useTransitionBug(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { to: BugStatus; assigneeId?: string; priority?: Priority }) => {
      const { data } = await api.post<{ bug: Bug }>(`/api/bugs/${id}/transition`, input);
      return data.bug;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.detail(id) });
      const prev = qc.getQueryData<Bug>(keys.detail(id));
      if (prev) qc.setQueryData(keys.detail(id), { ...prev, status: input.to });
      return { prev };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.detail(id), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: ['bugs', 'list'] });
    },
  });
}

export function useAddScreenshots(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (urls: string[]) => {
      const { data } = await api.post<{ bug: Bug }>(`/api/bugs/${id}/screenshots`, { urls });
      return data.bug;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(id) }),
  });
}
