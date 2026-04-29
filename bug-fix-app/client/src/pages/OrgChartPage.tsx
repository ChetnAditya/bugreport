import { useParams, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTeam, useTeamMembers } from '@/hooks/use-teams';
import { useDirectReports } from '@/hooks/use-org-chart';
import { useMe } from '@/hooks/use-auth';
import { ChevronRight, Users } from 'lucide-react';

const roleLabel: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  TEAMLEAD: 'Lead',
  DEVELOPER: 'Developer',
  TESTER: 'Tester',
};

function ReportTree({ userId, depth = 0 }: { userId: string; depth?: number }) {
  const reports = useDirectReports(userId);

  if (reports.isLoading) {
    return <Skeleton className="h-8 w-48" />;
  }

  if (!reports.data || reports.data.length === 0) return null;

  return (
    <ul className="pl-6 border-l border-border">
      {reports.data.map((r) => (
        <li key={r.id} className="py-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-tertiary">
                <ChevronRight className="h-3 w-3" />
              </span>
              <span className="font-display text-sm truncate">{r.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {roleLabel[r.role] ?? r.role}
              </Badge>
            </div>
          </div>
          <ReportTree userId={r.id} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

export function OrgChartPage() {
  const me = useMe();
  const isLead = me.data?.role === 'TEAMLEAD' || me.data?.role === 'SUPERADMIN';

  if (!isLead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="h-12 w-12 text-tertiary mb-4" />
        <h1 className="font-display text-xl mb-2">Org Chart</h1>
        <p className="text-secondary text-sm">Only leads and admins can view the org chart.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Org Chart</h1>
      <div className="rounded-xl border border-default bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="font-display text-sm">{me.data?.name}</span>
          <Badge variant="outline">{roleLabel[me.data?.role ?? ''] ?? me.data?.role}</Badge>
          {me.data?.team && <span className="text-xs text-tertiary">· {me.data.team.name}</span>}
        </div>
        <ReportTree userId={me.data!.id} />
      </div>
    </div>
  );
}
