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
        <header className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 border-b border-default px-4 py-2 text-xs uppercase tracking-wider text-tertiary font-mono">
          <span>User</span><span>Role</span><span>Joined</span><span></span>
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
