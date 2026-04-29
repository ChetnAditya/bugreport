import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/domain';

const roleLabel: Record<User['role'], string> = {
  SUPERADMIN: 'Superadmin',
  TEAMLEAD: 'Lead',
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
    <li className="flex items-center gap-3 border-b border-default px-4 py-3 min-h-[56px]">
      <div className="flex-1 min-w-0">
        <p className="truncate font-display text-sm">{user.name}</p>
        <p className="truncate text-xs text-tertiary">{user.email}</p>
      </div>
      <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-secondary">
        {roleLabel[user.role]}
      </span>
      {user.team && (
        <span className="text-xs text-tertiary truncate max-w-[100px]">{user.team.name}</span>
      )}
      {user.directManager && (
        <span className="text-xs text-tertiary truncate max-w-[100px]">
          ↳ {user.directManager.name}
        </span>
      )}
      <span className="font-mono text-xs text-tertiary shrink-0">
        {format(new Date(user.createdAt), 'PP')}
      </span>
      <Button size="sm" variant="outline" onClick={onChangeRole} disabled={isSelf}>
        Change role
      </Button>
    </li>
  );
}
