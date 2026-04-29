import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BugStatus, Severity, Priority, User } from '@/types/domain';

export interface SummaryResponse {
  total: number;
  byStatus: Record<BugStatus, number>;
  bySeverity: Record<Severity, number>;
  byPriority: Record<Priority, number>;
}

export interface DeveloperStat {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  assigned: number;
  fixed: number;
  avgFixHours: number | null;
}

export function useStatsSummary() {
  return useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<SummaryResponse>('/api/stats/summary');
      return data;
    },
  });
}

export function useDeveloperStats() {
  return useQuery({
    queryKey: ['stats', 'developers'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DeveloperStat[] }>('/api/stats/developers');
      return data.data;
    },
  });
}
