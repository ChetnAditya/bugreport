import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { BugListFilter } from '@/hooks/bugs/use-bugs';
import type { BugStatus, Severity, Priority } from '@/types/domain';

const STATUS: BugStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'];
const SEVERITY: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY: Priority[] = ['P1', 'P2', 'P3', 'P4'];

export function FilterBar({
  filter,
  onChange,
}: {
  filter: BugListFilter;
  onChange: (next: Partial<BugListFilter>) => void;
}) {
  const [q, setQ] = useState(filter.q ?? '');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative flex-1 min-w-[220px]"
        onSubmit={(e) => {
          e.preventDefault();
          onChange({ q: q || undefined });
        }}
        role="search"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
        <Input
          aria-label="Search bugs"
          placeholder="Search bugs..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </form>

      <FilterDropdown label="Status" value={filter.status} options={STATUS} onChange={(v) => onChange({ status: v as BugStatus | undefined })} />
      <FilterDropdown label="Severity" value={filter.severity} options={SEVERITY} onChange={(v) => onChange({ severity: v as Severity | undefined })} />
      <FilterDropdown label="Priority" value={filter.priority} options={PRIORITY} onChange={(v) => onChange({ priority: v as Priority | undefined })} />
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-mono">
          {label}{value ? `: ${value}` : ''}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuItem key={o} onSelect={() => onChange(o)}>
            {o}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onChange(undefined)}>Clear</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
