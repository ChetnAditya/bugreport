import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Bug } from '@/types/domain';
import { StatusBadge } from './StatusBadge';
import { SeverityChip } from './SeverityChip';
import { PriorityChip } from './PriorityChip';

export function BugRow({ bug }: { bug: Bug }) {
  return (
    <Link
      to={`/bugs/${bug.id}`}
      className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 border-b border-default px-4 py-3 hover:bg-elevated focus-visible:bg-elevated min-h-[56px]"
    >
      <div className="min-w-0">
        <p className="truncate font-display text-sm">{bug.title}</p>
        <p className="text-xs text-tertiary">
          {bug.reporter?.name ?? '—'} · opened{' '}
          {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
        </p>
      </div>
      <SeverityChip severity={bug.severity} />
      <PriorityChip priority={bug.priority} />
      <span className="text-xs text-tertiary font-mono hidden md:inline">
        {bug.assignee?.name ?? 'Unassigned'}
      </span>
      <StatusBadge status={bug.status} />
    </Link>
  );
}
