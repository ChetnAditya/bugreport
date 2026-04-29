import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import type { SummaryResponse } from '@/hooks/use-stats';

const COLORS: Record<string, string> = {
  LOW: 'rgb(var(--sev-low))',
  MEDIUM: 'rgb(var(--sev-med))',
  HIGH: 'rgb(var(--sev-high))',
  CRITICAL: 'rgb(var(--sev-critical))',
};

export function SeverityDonut({ data }: { data: SummaryResponse['bySeverity'] }) {
  const rows = Object.entries(data).map(([name, value]) => ({ name, value }));
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <div className="rounded-xl border border-default bg-surface p-5">
      <h2 className="font-display text-base mb-3">Severity mix</h2>
      <div className="h-64" aria-label={`Donut chart, ${total} bugs total`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" innerRadius={48} outerRadius={86} paddingAngle={2}>
              {rows.map((r) => <Cell key={r.name} fill={COLORS[r.name] ?? '#fff'} />)}
            </Pie>
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono Variable' }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgb(var(--bg-elevated))',
                border: '1px solid rgb(var(--border))',
                color: 'rgb(var(--text-primary))',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
