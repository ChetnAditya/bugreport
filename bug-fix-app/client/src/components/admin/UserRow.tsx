import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/domain';

const roleLabel: Record<User['role'], string> = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  TESTER: 'Tester',
};

export function UserRow({
  user,
  onChangeRole,
  isSelf,
}: {
  user: User;
  onChangeRole: () => void;
  isSelf: boolean;
}) {
  return (
    <li className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 border-b border-default px-4 py-3 min-h-[56px]">
      <div className="min-w-0">
        <p className="truncate font-display text-sm">{user.name}</p>
        <p className="truncate text-xs text-tertiary">{user.email}</p>
      </div>
      <span className="font-mono text-xs">{roleLabel[user.role]}</span>
      <span className="font-mono text-xs text-tertiary">
        {format(new Date(user.createdAt), 'PP')}
      </span>
      <Button size="sm" variant="outline" onClick={onChangeRole} disabled={isSelf}>
        Change role
      </Button>
    </li>
  );
}
