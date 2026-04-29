import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SummaryResponse } from '@/hooks/use-stats';

export function BugStatusChart({ data }: { data: SummaryResponse['byStatus'] }) {
  const rows = Object.entries(data).map(([status, count]) => ({ status, count }));
  return (
    <div className="rounded-xl border border-default bg-surface p-5">
      <h2 className="font-display text-base mb-3">Bugs by status</h2>
      <div className="h-64" aria-label="Bar chart of bugs by status">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
            <XAxis dataKey="status" stroke="rgb(var(--text-tertiary))" fontSize={11} />
            <YAxis stroke="rgb(var(--text-tertiary))" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'rgb(var(--bg-elevated))',
                border: '1px solid rgb(var(--border))',
                color: 'rgb(var(--text-primary))',
                fontFamily: 'JetBrains Mono Variable',
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
