import { X } from 'lucide-react';
import type { BugListFilter } from '@/hooks/bugs/use-bugs';

const labelMap: Record<keyof BugListFilter, string> = {
  status: 'Status',
  severity: 'Severity',
  priority: 'Priority',
  assigneeId: 'Assignee',
  q: 'Search',
  page: 'Page',
  limit: 'Limit',
};

export function ActiveFilterChips({
  filter,
  onClear,
  onRemove,
}: {
  filter: BugListFilter;
  onClear: () => void;
  onRemove: (key: keyof BugListFilter) => void;
}) {
  const entries = (Object.entries(filter) as [keyof BugListFilter, unknown][]).filter(
    ([k, v]) => v !== undefined && k !== 'page' && k !== 'limit',
  );
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(([k, v]) => (
        <button
          key={k}
          type="button"
          onClick={() => onRemove(k)}
          className="inline-flex items-center gap-1 rounded-md border border-default bg-elevated px-2 py-1 text-xs font-mono text-secondary hover:text-primary"
          aria-label={`Remove ${labelMap[k]} filter`}
        >
          {labelMap[k]}: {String(v)} <X className="h-3 w-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-xs text-tertiary underline hover:text-primary"
      >
        Clear all
      </button>
    </div>
  );
}
