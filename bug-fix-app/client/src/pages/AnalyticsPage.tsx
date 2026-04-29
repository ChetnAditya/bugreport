import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useStatsSummary, useDeveloperStats } from '@/hooks/use-stats';
import { KpiCard } from '@/components/common/KpiCard';

const BugStatusChart = lazy(() =>
  import('@/components/analytics/BugStatusChart').then((m) => ({ default: m.BugStatusChart })),
);
const SeverityDonut = lazy(() =>
  import('@/components/analytics/SeverityDonut').then((m) => ({ default: m.SeverityDonut })),
);
const DeveloperLeaderboard = lazy(() =>
  import('@/components/analytics/DeveloperLeaderboard').then((m) => ({
    default: m.DeveloperLeaderboard,
  })),
);

export function AnalyticsPage() {
  const summary = useStatsSummary();
  const devs = useDeveloperStats();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl">Analytics</h1>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total" value={summary.data?.total ?? <Skeleton className="h-8 w-12" />} />
        <KpiCard label="Open" value={(summary.data?.byStatus.NEW ?? 0) + (summary.data?.byStatus.ASSIGNED ?? 0) + (summary.data?.byStatus.IN_PROGRESS ?? 0)} />
        <KpiCard label="Fixed" value={summary.data?.byStatus.FIXED ?? 0} />
        <KpiCard label="Closed" value={summary.data?.byStatus.CLOSED ?? 0} />
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          {summary.data && <BugStatusChart data={summary.data.byStatus} />}
        </Suspense>
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          {summary.data && <SeverityDonut data={summary.data.bySeverity} />}
        </Suspense>
      </section>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        {devs.data && <DeveloperLeaderboard rows={devs.data} />}
      </Suspense>
    </div>
  );
}
