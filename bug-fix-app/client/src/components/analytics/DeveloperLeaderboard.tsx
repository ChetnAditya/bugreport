import type { DeveloperStat } from '@/hooks/use-stats';

export function DeveloperLeaderboard({ rows }: { rows: DeveloperStat[] }) {
  const sorted = [...rows].sort((a, b) => b.fixed - a.fixed);
  return (
    <section className="rounded-xl border border-default bg-surface" aria-label="Developer performance">
      <header className="border-b border-default px-5 py-3">
        <h2 className="font-display text-base">Developer performance</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-tertiary font-mono">
              <th className="px-5 py-2">Developer</th>
              <th className="px-3 py-2 text-right">Assigned</th>
              <th className="px-3 py-2 text-right">Fixed</th>
              <th className="px-5 py-2 text-right">Avg fix (hrs)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-tertiary">
                  No developers yet.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.user.id} className="border-t border-default">
                  <td className="px-5 py-3">
                    <p className="font-display">{r.user.name}</p>
                    <p className="text-xs text-tertiary">{r.user.email}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-mono">{r.assigned}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-mono">{r.fixed}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-mono">
                    {r.avgFixHours == null ? '—' : r.avgFixHours.toFixed(1)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
