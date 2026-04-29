import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTeam, useTeamMembers } from '@/hooks/use-teams';
import { useMe } from '@/hooks/use-auth';
import { format } from 'date-fns';

const roleLabel: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  TEAMLEAD: 'Lead',
  DEVELOPER: 'Developer',
  TESTER: 'Tester',
};

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const team = useTeam(id ?? '');
  const members = useTeamMembers(id ?? '');

  const isMember = me.data?.teamId === id;
  const canManage = me.data?.role === 'SUPERADMIN';

  if (team.isLoading || members.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!team.data) {
    return <p className="text-secondary">Team not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl">{team.data.name}</h1>
          {team.data.description && (
            <p className="text-sm text-tertiary mt-1">{team.data.description}</p>
          )}
          <p className="text-xs text-tertiary mt-1">
            Created {format(new Date(team.data.createdAt), 'PP')}
          </p>
        </div>
        {canManage && (
          <Link to={`/teams/${id}/settings`}>
            <button className="text-xs text-accent underline">Edit team</button>
          </Link>
        )}
      </div>

      <section>
        <h2 className="font-display text-base mb-3">Members ({members.data?.length ?? 0})</h2>
        <div className="rounded-xl border border-default bg-surface">
          {members.isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : members.data?.length === 0 ? (
            <p className="p-6 text-center text-tertiary">No members.</p>
          ) : (
            <ul>
              {(members.data ?? []).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between border-b border-default px-4 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm">{m.name}</p>
                    <p className="truncate text-xs text-tertiary">{m.email}</p>
                  </div>
                  <Badge variant="outline">{roleLabel[m.role] ?? m.role}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
