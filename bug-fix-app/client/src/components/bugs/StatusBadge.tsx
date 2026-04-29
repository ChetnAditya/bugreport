import { CircleDot, Hourglass, Wrench, CheckCircle2, ShieldCheck, Archive, UserPlus } from 'lucide-react';
import type { BugStatus } from '@/types/domain';
import { cn } from '@/lib/utils';

const meta: Record<BugStatus, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  NEW:         { label: 'New',         icon: CircleDot,    tone: 'bg-elevated text-secondary' },
  ASSIGNED:    { label: 'Assigned',    icon: UserPlus,     tone: 'bg-elevated text-indigo-300' },
  IN_PROGRESS: { label: 'In Progress', icon: Hourglass,    tone: 'bg-elevated text-amber-300' },
  FIXED:       { label: 'Fixed',       icon: Wrench,       tone: 'bg-elevated text-emerald-300' },
  VERIFIED:    { label: 'Verified',    icon: ShieldCheck,  tone: 'bg-elevated text-teal-300' },
  CLOSED:      { label: 'Closed',      icon: Archive,      tone: 'bg-elevated text-tertiary' },
};

export function StatusBadge({ status, className }: { status: BugStatus; className?: string }) {
  const m = meta[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-default px-2 py-0.5 text-xs font-mono',
        m.tone,
        className,
      )}
      aria-label={`Status: ${m.label}`}
    >
      <m.icon className="h-3.5 w-3.5" aria-hidden /> {m.label}
    </span>
  );
}
