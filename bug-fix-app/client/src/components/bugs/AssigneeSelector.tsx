import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types/domain';

export function AssigneeSelector({
  value,
  onChange,
  teamId,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
  teamId?: string | null;
}) {
  const devs = useQuery({
    queryKey: ['users', 'developers', teamId ?? null],
    queryFn: async () => {
      const params: Record<string, string> = { role: 'DEVELOPER' };
      if (teamId) params.teamId = teamId;
      const { data } = await api.get<{ data: User[] }>('/api/users', { params });
      return data.data;
    },
    enabled: true,
  });
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Assignee"><SelectValue placeholder="Select developer" /></SelectTrigger>
      <SelectContent>
        {(devs.data ?? []).map((u) => (
          <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>
        ))}
        {(devs.data ?? []).length === 0 && (
          <SelectItem value="__none__" disabled>No developers available</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
