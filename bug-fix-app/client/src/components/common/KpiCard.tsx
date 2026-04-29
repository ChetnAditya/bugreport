import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function KpiCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-default bg-surface p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-tertiary font-mono">{label}</p>
        <span className="text-tertiary">{icon}</span>
      </div>
      <p className="mt-3 font-display text-2xl tabular-nums">{value}</p>
      {hint && <p className="text-xs text-tertiary mt-1">{hint}</p>}
    </div>
  );
}
