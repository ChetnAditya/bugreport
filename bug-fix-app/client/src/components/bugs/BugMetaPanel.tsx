import type { Bug } from '@/types/domain';
import { StatusBadge } from './StatusBadge';
import { SeverityChip } from './SeverityChip';
import { PriorityChip } from './PriorityChip';
import { format } from 'date-fns';

export function BugMetaPanel({ bug }: { bug: Bug }) {
  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4 rounded-xl border border-default bg-surface p-5">
      <div>
        <p className="text-xs text-tertiary font-mono uppercase tracking-wider">Status</p>
        <div className="mt-1"><StatusBadge status={bug.status} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs font-mono text-tertiary">
        <div>
          <p className="uppercase tracking-wider">Severity</p>
          <div className="mt-1"><SeverityChip severity={bug.severity} /></div>
        </div>
        <div>
          <p className="uppercase tracking-wider">Priority</p>
          <div className="mt-1"><PriorityChip priority={bug.priority} /></div>
        </div>
      </div>
      <div className="space-y-1 text-xs font-mono text-tertiary">
        <p><span className="uppercase tracking-wider">Reporter</span><br /><span className="text-secondary">{bug.reporter?.name ?? '—'}</span></p>
        <p><span className="uppercase tracking-wider">Assignee</span><br /><span className="text-secondary">{bug.assignee?.name ?? 'Unassigned'}</span></p>
        {bug.team && (
          <p><span className="uppercase tracking-wider">Team</span><br /><span className="text-secondary">{bug.team.name}</span></p>
        )}
      </div>
      <div className="space-y-1 text-xs font-mono text-tertiary">
        <p><span className="uppercase tracking-wider">Opened</span><br /><span className="text-secondary">{format(new Date(bug.createdAt), 'PP p')}</span></p>
        {bug.closedAt && (
          <p><span className="uppercase tracking-wider">Closed</span><br /><span className="text-secondary">{format(new Date(bug.closedAt), 'PP p')}</span></p>
        )}
      </div>
      <p className="font-mono text-[10px] text-tertiary break-all">id: {bug.id}</p>
    </aside>
  );
}
