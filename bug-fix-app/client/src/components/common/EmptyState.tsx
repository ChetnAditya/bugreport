import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-default bg-surface/50 p-12 text-center',
        className,
      )}
    >
      <div className="mb-3 text-tertiary">{icon}</div>
      <h2 className="font-display text-base">{title}</h2>
      {description && <p className="text-secondary text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
