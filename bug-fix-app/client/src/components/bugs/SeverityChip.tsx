import { ShieldAlert } from 'lucide-react';
import type { Severity } from '@/types/domain';
import { cn } from '@/lib/utils';

const map: Record<Severity, { label: string; cls: string }> = {
  LOW:      { label: 'Low',      cls: 'text-sev-low' },
  MEDIUM:   { label: 'Medium',   cls: 'text-sev-med' },
  HIGH:     { label: 'High',     cls: 'text-sev-high' },
  CRITICAL: { label: 'Critical', cls: 'text-sev-critical' },
};

export function SeverityChip({ severity, className }: { severity: Severity; className?: string }) {
  const m = map[severity];
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono', m.cls, className)}
      aria-label={`Severity: ${m.label}`}
    >
      <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> {m.label}
    </span>
  );
}
