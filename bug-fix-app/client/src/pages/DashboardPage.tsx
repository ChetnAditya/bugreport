import { Link } from 'react-router-dom';
import { Bug, ShieldAlert, Hourglass, CheckCircle2 } from 'lucide-react';
import { useBugList } from '@/hooks/bugs/use-bugs';
import { KpiCard } from '@/components/common/KpiCard';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/bugs/StatusBadge';
import { SeverityChip } from '@/components/bugs/SeverityChip';
import { EmptyState } from '@/components/common/EmptyState';
import { useMe } from '@/hooks/use-auth';

export function DashboardPage() {
  const me = useMe();
  const recent = useBugList({ page: 1, limit: 8 });
  const open = useBugList({ status: 'NEW', page: 1, limit: 1 });
  const wip = useBugList({ status: 'IN_PROGRESS', page: 1, limit: 1 });
  const fixed = useBugList({ status: 'FIXED', page: 1, limit: 1 });
  const closed = useBugList({ status: 'CLOSED', page: 1, limit: 1 });

  const canCreate = ['TESTER', 'TEAMLEAD', 'SUPERADMIN'].includes(me.data?.role ?? '');

  return (
    <div className="space-y-8">
      <h1 className="font-display text-xl">Dashboard</h1>
      <section
        aria-label="Bug counts"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <KpiCard label="New" value={open.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<Bug className="h-4 w-4" />} />
        <KpiCard label="In progress" value={wip.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<Hourglass className="h-4 w-4" />} />
        <KpiCard label="Fixed" value={fixed.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<ShieldAlert className="h-4 w-4" />} />
        <KpiCard label="Closed" value={closed.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<CheckCircle2 className="h-4 w-4" />} />
      </section>

      <section aria-labelledby="recent-heading" className="rounded-xl border border-default bg-surface">
        <header className="flex items-center justify-between border-b border-default px-5 py-3">
          <h2 id="recent-heading" className="font-display text-base">Recent bugs</h2>
          <Link to="/bugs" className="text-xs text-accent underline">See all →</Link>
        </header>
        {recent.isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : recent.data?.data.length === 0 ? (
          <EmptyState
            title="No bugs yet"
            description={canCreate ? 'Be the first to report one.' : 'No bugs assigned yet.'}
            action={
              canCreate ? (
                <Link to="/bugs/new" className="text-accent underline">
                  Report a bug →
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-default">
            {recent.data?.data.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                <Link to={`/bugs/${b.id}`} className="flex-1 truncate font-display hover:underline">
                  {b.title}
                </Link>
                <SeverityChip severity={b.severity} />
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
