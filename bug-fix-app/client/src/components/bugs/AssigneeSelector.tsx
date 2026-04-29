import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types/domain';

export function AssigneeSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const devs = useQuery({
    queryKey: ['users', 'developers'],
    queryFn: async () => {
      const { data } = await api.get<{ data: User[] }>('/api/users?role=DEVELOPER');
      return data.data;
    },
  });
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Assignee"><SelectValue placeholder="Select developer" /></SelectTrigger>
      <SelectContent>
        {(devs.data ?? []).map((u) => (
          <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
