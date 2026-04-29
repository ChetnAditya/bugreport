import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/hooks/use-users';
import { useMe } from '@/hooks/use-auth';
import { UserRow } from '@/components/admin/UserRow';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import type { User } from '@/types/domain';

export function UsersPage() {
  const me = useMe();
  const list = useUsers();
  const [editing, setEditing] = useState<User | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Users</h1>
      <div className="rounded-xl border border-default bg-surface">
        <header className="flex items-center gap-3 border-b border-default px-4 py-2 text-xs uppercase tracking-wider text-tertiary font-mono">
          <span className="flex-1">User</span>
          <span className="w-20">Role</span>
          <span className="w-24 truncate">Team</span>
          <span className="w-24 truncate">Reports to</span>
          <span className="w-24">Joined</span>
          <span className="w-28"></span>
        </header>
        {list.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <ul>
            {(list.data ?? []).map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === me.data?.id}
                onChangeRole={() => setEditing(u)}
              />
            ))}
          </ul>
        )}
      </div>
      <RoleChangeDialog
        user={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
