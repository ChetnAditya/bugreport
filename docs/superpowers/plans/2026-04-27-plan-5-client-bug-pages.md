# Plan 5 — Client Bug Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the bug-tracking UI: dashboard, list (virtualized + URL-synced filters), 3-step create wizard with Cloudinary screenshot upload, detail page with state-aware transitions, and the comments thread. End state: a tester can report a bug with screenshots, an admin can assign it, a developer can move it through the lifecycle, and a tester can verify — all via the UI.

**Architecture:** New feature slices `components/bugs/` and `components/comments/`, hooks under `hooks/bugs/`. Filters are mirrored into URL search params (deep-linkable). List virtualizes via `@tanstack/react-virtual`. Direct-to-Cloudinary upload uses the signed payload from Plan 2. State transitions render conditionally via a small client mirror of the lifecycle table — server stays authoritative.

**Tech Stack:** Plan 4 stack + `@tanstack/react-virtual`, `cmdk` (command palette), `react-dropzone` (screenshot drop).

**Prereqs:** Plans 1–4 complete.

---

## File Structure

```
client/src/
├── hooks/bugs/
│   ├── use-bugs.ts                  list / detail / create / update / delete / transition
│   ├── use-bug-filters.ts           url ⇄ filter state
│   ├── use-comments.ts              list / create / update / delete
│   └── use-cloudinary-upload.ts     sign → POST file → return URL
├── components/bugs/
│   ├── StatusBadge.tsx
│   ├── SeverityChip.tsx
│   ├── PriorityChip.tsx
│   ├── BugRow.tsx
│   ├── FilterBar.tsx
│   ├── ActiveFilterChips.tsx
│   ├── SortMenu.tsx
│   ├── Pagination.tsx
│   ├── BugWizard.tsx                3-step create
│   ├── ScreenshotDrop.tsx
│   ├── ScreenshotGallery.tsx
│   ├── Lightbox.tsx
│   ├── BugMetaPanel.tsx             detail-page side panel
│   ├── TransitionMenu.tsx
│   ├── AssigneeSelector.tsx
│   └── BugTimeline.tsx              status + comments stream
├── components/comments/
│   ├── CommentThread.tsx
│   ├── CommentItem.tsx
│   └── CommentEditor.tsx
├── components/common/
│   ├── EmptyState.tsx
│   └── KpiCard.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── BugListPage.tsx
│   ├── BugCreatePage.tsx
│   ├── BugDetailPage.tsx
│   └── BugEditPage.tsx
└── lib/
    └── lifecycle-client.ts          client mirror of allowed transitions (UI-only)
```

---

## Task 1: Bug API hooks

**Files:**
- Create: `client/src/hooks/bugs/use-bugs.ts`
- Create: `client/src/hooks/bugs/use-comments.ts`

- [ ] **Step 1: `use-bugs.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Bug,
  BugStatus,
  Severity,
  Priority,
} from '@/types/domain';

export interface BugListResponse {
  data: Bug[];
  total: number;
  page: number;
  limit: number;
}

export interface BugListFilter {
  status?: BugStatus;
  severity?: Severity;
  priority?: Priority;
  assigneeId?: string;
  q?: string;
  page?: number;
  limit?: number;
}

const keys = {
  list: (f: BugListFilter) => ['bugs', 'list', f] as const,
  detail: (id: string) => ['bugs', 'detail', id] as const,
};

export function useBugList(filter: BugListFilter) {
  return useQuery({
    queryKey: keys.list(filter),
    queryFn: async () => {
      const { data } = await api.get<BugListResponse>('/api/bugs', { params: filter });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useBug(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? '_'),
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ bug: Bug }>(`/api/bugs/${id}`);
      return data.bug;
    },
  });
}

export interface CreateBugInput {
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  screenshots?: string[];
}

export function useCreateBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBugInput) => {
      const { data } = await api.post<{ bug: Bug }>('/api/bugs', input);
      return data.bug;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bugs'] }),
  });
}

export function useUpdateBug(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pick<Bug, 'title' | 'description' | 'stepsToReproduce'>>) => {
      const { data } = await api.patch<{ bug: Bug }>(`/api/bugs/${id}`, input);
      return data.bug;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: ['bugs', 'list'] });
    },
  });
}

export function useDeleteBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/bugs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bugs'] }),
  });
}

export function useTransitionBug(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { to: BugStatus; assigneeId?: string; priority?: Priority }) => {
      const { data } = await api.post<{ bug: Bug }>(`/api/bugs/${id}/transition`, input);
      return data.bug;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: keys.detail(id) });
      const prev = qc.getQueryData<Bug>(keys.detail(id));
      if (prev) qc.setQueryData(keys.detail(id), { ...prev, status: input.to });
      return { prev };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.detail(id), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.detail(id) });
      qc.invalidateQueries({ queryKey: ['bugs', 'list'] });
    },
  });
}

export function useAddScreenshots(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (urls: string[]) => {
      const { data } = await api.post<{ bug: Bug }>(`/api/bugs/${id}/screenshots`, { urls });
      return data.bug;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.detail(id) }),
  });
}
```

- [ ] **Step 2: `use-comments.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Comment } from '@/types/domain';

const key = (bugId: string) => ['bugs', 'comments', bugId] as const;

export function useComments(bugId: string) {
  return useQuery({
    queryKey: key(bugId),
    queryFn: async () => {
      const { data } = await api.get<{ data: Comment[] }>(`/api/bugs/${bugId}/comments`);
      return data.data;
    },
  });
}

export function useCreateComment(bugId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<{ comment: Comment }>(`/api/bugs/${bugId}/comments`, { text });
      return data.comment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
  });
}

export function useUpdateComment(bugId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.patch<{ comment: Comment }>(`/api/comments/${id}`, { text });
      return data.comment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
  });
}

export function useDeleteComment(bugId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/api/comments/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bugId) }),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/bugs
git commit -m "feat(client): bug + comment query hooks"
```

---

## Task 2: Status / Severity / Priority chips (TDD — basic snapshot + a11y)

**Files:**
- Create: `client/src/components/bugs/StatusBadge.tsx`
- Create: `client/src/components/bugs/SeverityChip.tsx`
- Create: `client/src/components/bugs/PriorityChip.tsx`
- Create: `client/src/tests/components/Chips.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// client/src/tests/components/Chips.test.tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { StatusBadge } from '@/components/bugs/StatusBadge';
import { SeverityChip } from '@/components/bugs/SeverityChip';
import { PriorityChip } from '@/components/bugs/PriorityChip';

describe('chips', () => {
  it('StatusBadge shows label + status text (color not alone)', () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  it('SeverityChip shows label', () => {
    render(<SeverityChip severity="CRITICAL" />);
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it('PriorityChip handles null', () => {
    const { container } = render(<PriorityChip priority={null} />);
    expect(container.textContent).toMatch(/—/);
  });

  it('a11y smoke', async () => {
    const { container } = render(
      <div>
        <StatusBadge status="NEW" />
        <SeverityChip severity="HIGH" />
        <PriorityChip priority="P2" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Write `StatusBadge.tsx`**

```tsx
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
```

- [ ] **Step 4: Write `SeverityChip.tsx`**

```tsx
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
```

- [ ] **Step 5: Write `PriorityChip.tsx`**

```tsx
import type { Priority } from '@/types/domain';
import { cn } from '@/lib/utils';

const map: Record<Priority, string> = {
  P1: 'bg-rose-400/15 text-rose-300',
  P2: 'bg-amber-400/15 text-amber-300',
  P3: 'bg-sky-400/15 text-sky-300',
  P4: 'bg-zinc-400/15 text-tertiary',
};

export function PriorityChip({ priority, className }: { priority: Priority | null; className?: string }) {
  if (!priority) {
    return (
      <span className={cn('inline-flex items-center text-xs text-tertiary font-mono', className)} aria-label="No priority">
        —
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono', map[priority], className)}
      aria-label={`Priority: ${priority}`}
    >
      {priority}
    </span>
  );
}
```

- [ ] **Step 6: Run, expect PASS**

Run: `cd client && npm test -- --run Chips`

- [ ] **Step 7: Commit**

```bash
git add client/src/components/bugs/StatusBadge.tsx client/src/components/bugs/SeverityChip.tsx client/src/components/bugs/PriorityChip.tsx client/src/tests/components/Chips.test.tsx
git commit -m "feat(client): status/severity/priority chips"
```

---

## Task 3: KpiCard + EmptyState common primitives

**Files:**
- Create: `client/src/components/common/KpiCard.tsx`
- Create: `client/src/components/common/EmptyState.tsx`

- [ ] **Step 1: `KpiCard.tsx`**

```tsx
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
```

- [ ] **Step 2: `EmptyState.tsx`**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/common/KpiCard.tsx client/src/components/common/EmptyState.tsx
git commit -m "feat(client): KpiCard + EmptyState"
```

---

## Task 4: DashboardPage

**Files:**
- Create: `client/src/pages/DashboardPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Write `DashboardPage.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { Bug, ShieldAlert, Hourglass, CheckCircle2 } from 'lucide-react';
import { useBugList } from '@/hooks/bugs/use-bugs';
import { KpiCard } from '@/components/common/KpiCard';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/bugs/StatusBadge';
import { SeverityChip } from '@/components/bugs/SeverityChip';
import { EmptyState } from '@/components/common/EmptyState';

export function DashboardPage() {
  const recent = useBugList({ page: 1, limit: 8 });
  const open = useBugList({ status: 'NEW', page: 1, limit: 1 });
  const wip = useBugList({ status: 'IN_PROGRESS', page: 1, limit: 1 });
  const fixed = useBugList({ status: 'FIXED', page: 1, limit: 1 });
  const closed = useBugList({ status: 'CLOSED', page: 1, limit: 1 });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-xl">Dashboard</h1>
      <section
        aria-label="Bug counts"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <KpiCard label="New" value={open.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<Bug className="h-4 w-4" />} />
        <KpiCard label="In progress" value={wip.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<Hourglass className="h-4 w-4" />} />
        <KpiCard label="Fixed" value={fixed.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<ShieldAlert className="h-4 w-4" />} />
        <KpiCard label="Closed" value={closed.data?.total ?? <Skeleton className="h-8 w-16" />} icon={<CheckCircle2 className="h-4 w-4" />} />
      </section>

      <section aria-labelledby="recent-heading" className="rounded-xl border border-default bg-surface">
        <header className="flex items-center justify-between border-b border-default px-5 py-3">
          <h2 id="recent-heading" className="font-display text-base">Recent bugs</h2>
          <Link to="/bugs" className="text-xs text-accent underline">See all →</Link>
        </header>
        {recent.isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : recent.data?.data.length === 0 ? (
          <EmptyState
            title="No bugs yet"
            description="Be the first to report one."
            action={
              <Link to="/bugs/new" className="text-accent underline">
                Report a bug →
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-default">
            {recent.data?.data.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                <Link to={`/bugs/${b.id}`} className="flex-1 truncate font-display hover:underline">
                  {b.title}
                </Link>
                <SeverityChip severity={b.severity} />
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Mount in `App.tsx`** (replace placeholder)

```tsx
import { DashboardPage } from '@/pages/DashboardPage';
<Route path="/dashboard" element={<Authed><DashboardPage /></Authed>} />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/DashboardPage.tsx client/src/App.tsx
git commit -m "feat(client): dashboard with KPIs + recent bugs"
```

---

## Task 5: URL-synced filters hook + ActiveFilterChips

**Files:**
- Create: `client/src/hooks/bugs/use-bug-filters.ts`
- Create: `client/src/components/bugs/ActiveFilterChips.tsx`

- [ ] **Step 1: `use-bug-filters.ts`**

```ts
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BugListFilter } from './use-bugs';
import type { BugStatus, Severity, Priority } from '@/types/domain';

const STATUS_VALUES: BugStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'];
const SEVERITY_VALUES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY_VALUES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function useBugFilters() {
  const [params, setParams] = useSearchParams();

  const filter = useMemo<BugListFilter>(() => {
    const page = Number(params.get('page') ?? 1);
    const limit = Number(params.get('limit') ?? 20);
    return {
      status: pick(params.get('status'), STATUS_VALUES),
      severity: pick(params.get('severity'), SEVERITY_VALUES),
      priority: pick(params.get('priority'), PRIORITY_VALUES),
      assigneeId: params.get('assigneeId') ?? undefined,
      q: params.get('q') ?? undefined,
      page: Number.isFinite(page) && page >= 1 ? page : 1,
      limit: Number.isFinite(limit) && limit >= 1 && limit <= 100 ? limit : 20,
    };
  }, [params]);

  function setFilter(next: Partial<BugListFilter>) {
    const merged: BugListFilter = { ...filter, ...next, page: next.page ?? 1 };
    const sp = new URLSearchParams();
    if (merged.status) sp.set('status', merged.status);
    if (merged.severity) sp.set('severity', merged.severity);
    if (merged.priority) sp.set('priority', merged.priority);
    if (merged.assigneeId) sp.set('assigneeId', merged.assigneeId);
    if (merged.q) sp.set('q', merged.q);
    if (merged.page && merged.page > 1) sp.set('page', String(merged.page));
    if (merged.limit && merged.limit !== 20) sp.set('limit', String(merged.limit));
    setParams(sp, { replace: false });
  }

  function clear() {
    setParams(new URLSearchParams(), { replace: false });
  }

  return { filter, setFilter, clear };
}
```

- [ ] **Step 2: `ActiveFilterChips.tsx`**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add client/src/hooks/bugs/use-bug-filters.ts client/src/components/bugs/ActiveFilterChips.tsx
git commit -m "feat(client): URL-synced bug filters + ActiveFilterChips"
```

---

## Task 6: FilterBar + SortMenu + Pagination

**Files:**
- Create: `client/src/components/bugs/FilterBar.tsx`
- Create: `client/src/components/bugs/SortMenu.tsx`
- Create: `client/src/components/bugs/Pagination.tsx`

- [ ] **Step 1: `FilterBar.tsx`**

```tsx
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
```

- [ ] **Step 2: `SortMenu.tsx`**

(Server returns newest-first by default; client-side sort would over-fetch, so this is a UI affordance for future expansion. For now we display "Newest first" as a label.)

```tsx
export function SortMenu() {
  return (
    <span className="text-xs font-mono text-tertiary">Sort: Newest first</span>
  );
}
```

- [ ] **Step 3: `Pagination.tsx`**

```tsx
import { Button } from '@/components/ui/button';

export function Pagination({
  page,
  limit,
  total,
  onPage,
}: {
  page: number;
  limit: number;
  total: number;
  onPage: (next: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between text-xs font-mono">
      <p className="text-tertiary">
        Page {page} of {pages} • {total} bugs
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/bugs/FilterBar.tsx client/src/components/bugs/SortMenu.tsx client/src/components/bugs/Pagination.tsx
git commit -m "feat(client): filter bar + sort + pagination"
```

---

## Task 7: BugRow + BugListPage with virtualization

**Files:**
- Create: `client/src/components/bugs/BugRow.tsx`
- Create: `client/src/pages/BugListPage.tsx`
- Modify: `client/src/App.tsx`
- Add dep: `@tanstack/react-virtual`

- [ ] **Step 1: Install dep**

Run: `cd client && npm install @tanstack/react-virtual@3.11.2`

- [ ] **Step 2: `BugRow.tsx`**

```tsx
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
```

(Add `date-fns` if not present: `npm install date-fns@4.1.0`)

- [ ] **Step 3: `BugListPage.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBugList } from '@/hooks/bugs/use-bugs';
import { useBugFilters } from '@/hooks/bugs/use-bug-filters';
import { FilterBar } from '@/components/bugs/FilterBar';
import { ActiveFilterChips } from '@/components/bugs/ActiveFilterChips';
import { Pagination } from '@/components/bugs/Pagination';
import { BugRow } from '@/components/bugs/BugRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useMe } from '@/hooks/use-auth';

export function BugListPage() {
  const { filter, setFilter, clear } = useBugFilters();
  const list = useBugList({ ...filter, limit: filter.limit ?? 50 });
  const me = useMe();
  const canCreate = me.data?.role === 'TESTER' || me.data?.role === 'ADMIN';

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = list.data?.data ?? [];
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl">Bugs</h1>
        {canCreate && (
          <Link to="/bugs/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New bug
            </Button>
          </Link>
        )}
      </div>

      <FilterBar filter={filter} onChange={setFilter} />
      <ActiveFilterChips
        filter={filter}
        onClear={clear}
        onRemove={(k) => setFilter({ [k]: undefined })}
      />

      <div className="rounded-xl border border-default bg-surface overflow-hidden">
        {list.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No bugs match your filters"
            description="Try clearing or relaxing the filters."
            action={<Button variant="outline" onClick={clear}>Clear filters</Button>}
          />
        ) : (
          <div ref={parentRef} className="max-h-[70vh] overflow-y-auto">
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((v) => {
                const bug = rows[v.index]!;
                return (
                  <div
                    key={bug.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${v.start}px)`,
                    }}
                  >
                    <BugRow bug={bug} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {list.data && (
        <Pagination
          page={list.data.page}
          limit={list.data.limit}
          total={list.data.total}
          onPage={(p) => setFilter({ page: p })}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Mount route in `App.tsx`**

```tsx
import { BugListPage } from '@/pages/BugListPage';
<Route path="/bugs" element={<Authed><BugListPage /></Authed>} />
```

- [ ] **Step 5: Manual smoke**

Run dev. Login as admin. Navigate `/bugs`. Confirm: rows render, filters update URL, chips appear, pagination works, virtualization activates with seeded fixtures.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/bugs/BugRow.tsx client/src/pages/BugListPage.tsx client/src/App.tsx client/package.json client/package-lock.json
git commit -m "feat(client): bug list page with virtualization + URL filters"
```

---

## Task 8: Cloudinary upload hook

**Files:**
- Create: `client/src/hooks/bugs/use-cloudinary-upload.ts`

- [ ] **Step 1: Write hook**

```ts
import { useState } from 'react';
import { api } from '@/lib/api';

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function useCloudinaryUpload(bugId: string) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    setError(null);
    setProgress(0);
    const { data: sign } = await api.get<SignResponse>(`/api/bugs/${bugId}/screenshots/sign`);
    const form = new FormData();
    form.set('file', file);
    form.set('api_key', sign.apiKey);
    form.set('timestamp', String(sign.timestamp));
    form.set('folder', sign.folder);
    form.set('signature', sign.signature);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const body = JSON.parse(xhr.responseText) as { secure_url: string };
          resolve(body.secure_url);
        } else {
          setError('Upload failed');
          reject(new Error(xhr.statusText));
        }
      };
      xhr.onerror = () => {
        setError('Network error');
        reject(new Error('network'));
      };
      xhr.send(form);
    });
  }

  return { uploadFile, progress, error };
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/bugs/use-cloudinary-upload.ts
git commit -m "feat(client): cloudinary signed-upload hook"
```

---

## Task 9: ScreenshotDrop + Gallery + Lightbox

**Files:**
- Create: `client/src/components/bugs/ScreenshotDrop.tsx`
- Create: `client/src/components/bugs/ScreenshotGallery.tsx`
- Create: `client/src/components/bugs/Lightbox.tsx`
- Add dep: `react-dropzone`

- [ ] **Step 1: Install**

Run: `cd client && npm install react-dropzone@14.3.5`

- [ ] **Step 2: `ScreenshotDrop.tsx`** (used in wizard before bug exists; uses a deferred-upload pattern — files held client-side until bug created, then uploaded)

```tsx
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = { 'image/png': [], 'image/jpeg': [], 'image/webp': [] };

export interface PendingFile {
  id: string;
  file: File;
  preview: string;
}

export function ScreenshotDrop({
  files,
  onChange,
}: {
  files: PendingFile[];
  onChange: (next: PendingFile[]) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_BYTES,
    maxFiles: MAX,
    disabled: files.length >= MAX,
    onDrop: (accepted) => {
      const next: PendingFile[] = accepted.slice(0, MAX - files.length).map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}`,
        file: f,
        preview: URL.createObjectURL(f),
      }));
      onChange([...files, ...next]);
    },
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer items-center justify-center rounded-md border border-dashed border-default bg-surface p-6 text-secondary',
          isDragActive && 'border-accent text-accent',
          files.length >= MAX && 'cursor-not-allowed opacity-60',
        )}
        aria-label="Add screenshots"
      >
        <input {...getInputProps()} />
        <ImagePlus className="h-5 w-5 mr-2" aria-hidden />
        {files.length >= MAX
          ? `Limit reached (${MAX})`
          : isDragActive
            ? 'Drop the images here'
            : 'Drag & drop or click — png/jpeg/webp, max 5MB each, 5 total'}
      </div>
      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 md:grid-cols-5">
          {files.map((f) => (
            <li key={f.id} className="relative">
              <img
                src={f.preview}
                alt={f.file.name}
                className="h-24 w-full rounded-md object-cover border border-default"
              />
              <button
                type="button"
                aria-label={`Remove ${f.file.name}`}
                onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                className="absolute right-1 top-1 rounded-md bg-base/80 p-1 text-tertiary hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `ScreenshotGallery.tsx`**

```tsx
import { useState } from 'react';
import { Lightbox } from './Lightbox';

export function ScreenshotGallery({ urls }: { urls: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (urls.length === 0) return null;
  return (
    <>
      <ul className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {urls.map((u, i) => (
          <li key={u}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block w-full"
              aria-label={`Open screenshot ${i + 1}`}
            >
              <img src={u} alt={`Screenshot ${i + 1}`} className="h-24 w-full rounded-md object-cover border border-default" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null && (
        <Lightbox urls={urls} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
```

- [ ] **Step 4: `Lightbox.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function Lightbox({
  urls,
  startIndex,
  onClose,
}: {
  urls: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(startIndex);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setI((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setI((p) => Math.min(urls.length - 1, p + 1));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, urls.length]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-md bg-elevated p-2">
        <X className="h-5 w-5" />
      </button>
      <button type="button" aria-label="Previous" onClick={() => setI((p) => Math.max(0, p - 1))} className="absolute left-4 rounded-md bg-elevated p-2 disabled:opacity-40" disabled={i === 0}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <img src={urls[i]} alt={`Screenshot ${i + 1}`} className="max-h-[85vh] max-w-[85vw] rounded-md border border-default" />
      <button type="button" aria-label="Next" onClick={() => setI((p) => Math.min(urls.length - 1, p + 1))} className="absolute right-4 rounded-md bg-elevated p-2 disabled:opacity-40" disabled={i === urls.length - 1}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/bugs/ScreenshotDrop.tsx client/src/components/bugs/ScreenshotGallery.tsx client/src/components/bugs/Lightbox.tsx client/package.json client/package-lock.json
git commit -m "feat(client): screenshot drop / gallery / lightbox"
```

---

## Task 10: BugWizard (3-step create) + BugCreatePage (TDD critical path)

**Files:**
- Create: `client/src/components/bugs/BugWizard.tsx`
- Create: `client/src/pages/BugCreatePage.tsx`
- Modify: `client/src/App.tsx`
- Create: `client/src/tests/pages/BugCreatePage.test.tsx`
- Modify: `client/src/tests/msw/handlers.ts` (add bug create handler)

- [ ] **Step 1: Extend MSW handlers**

```ts
// add to handlers.ts
import type { Bug } from '@/types/domain';

const SAMPLE_BUG: Bug = {
  id: 'b1',
  title: 't',
  description: 'd',
  stepsToReproduce: 's',
  severity: 'HIGH',
  priority: null,
  status: 'NEW',
  screenshots: [],
  reporterId: 'u1',
  assigneeId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  closedAt: null,
};

export const baseHandlers = [
  // ... existing handlers ...
  http.post('http://localhost:4000/api/bugs', async ({ request }) => {
    const body = (await request.json()) as { title: string; severity: string };
    return HttpResponse.json({ bug: { ...SAMPLE_BUG, ...body } }, { status: 201 });
  }),
  http.get('http://localhost:4000/api/bugs', () => HttpResponse.json({ data: [], total: 0, page: 1, limit: 20 })),
];
```

- [ ] **Step 2: Write failing test**

```tsx
// client/src/tests/pages/BugCreatePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';
import { BugCreatePage } from '@/pages/BugCreatePage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/bugs/new']}>
        <Routes>
          <Route path="/bugs/new" element={<BugCreatePage />} />
          <Route path="/bugs/:id" element={<div>detail page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BugCreatePage', () => {
  it('creates a bug from steps 1 → 2 → 3', async () => {
    renderPage();
    // step 1
    await userEvent.type(screen.getByLabelText(/title/i), 'Login broken');
    await userEvent.type(screen.getByLabelText(/description/i), 'Clicking login does nothing on Chrome');
    await userEvent.click(screen.getByRole('combobox', { name: /severity/i }));
    await userEvent.click(screen.getByRole('option', { name: /high/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    // step 2
    await userEvent.type(screen.getByLabelText(/steps to reproduce/i), '1. open /login 2. click 3. nothing');
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    // step 3 (no screenshots)
    await userEvent.click(screen.getByRole('button', { name: /submit bug/i }));
    await waitFor(() => expect(screen.getByText('detail page')).toBeInTheDocument());
  });

  it('a11y smoke', async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 3: Run, expect FAIL**

- [ ] **Step 4: `BugWizard.tsx`**

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScreenshotDrop, type PendingFile } from './ScreenshotDrop';
import { useCreateBug, useAddScreenshots } from '@/hooks/bugs/use-bugs';
import { useCloudinaryUpload } from '@/hooks/bugs/use-cloudinary-upload';
import type { Severity } from '@/types/domain';

const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const step1 = z.object({
  title: z.string().min(3, 'Min 3 characters').max(140),
  description: z.string().min(10, 'Min 10 characters').max(5000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});
const step2 = z.object({
  stepsToReproduce: z.string().min(5, 'Min 5 characters').max(2000),
});

export function BugWizard() {
  const [step, setStep] = useState(1);
  const [vals, setVals] = useState<{
    title?: string;
    description?: string;
    severity?: Severity;
    stepsToReproduce?: string;
  }>({});
  const [files, setFiles] = useState<PendingFile[]>([]);
  const create = useCreateBug();
  const nav = useNavigate();

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-xs font-mono" aria-label="Steps">
        {[1, 2, 3].map((s) => (
          <li
            key={s}
            className={
              s === step
                ? 'rounded-md bg-accent px-2 py-1 text-base font-semibold'
                : 'rounded-md border border-default px-2 py-1 text-tertiary'
            }
          >
            Step {s}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <Step1
          defaults={vals}
          onNext={(v) => {
            setVals({ ...vals, ...v });
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <Step2
          defaults={vals}
          onBack={() => setStep(1)}
          onNext={(v) => {
            setVals({ ...vals, ...v });
            setStep(3);
          }}
        />
      )}
      {step === 3 && (
        <Step3
          files={files}
          setFiles={setFiles}
          onBack={() => setStep(2)}
          onSubmit={async () => {
            try {
              const bug = await create.mutateAsync({
                title: vals.title!,
                description: vals.description!,
                stepsToReproduce: vals.stepsToReproduce!,
                severity: vals.severity!,
              });
              if (files.length > 0) {
                await uploadAndAttach(bug.id, files);
              }
              toast.success('Bug submitted');
              nav(`/bugs/${bug.id}`);
            } catch {
              toast.error('Could not submit bug');
            }
          }}
          submitting={create.isPending}
        />
      )}
    </div>
  );
}

async function uploadAndAttach(bugId: string, files: PendingFile[]) {
  const { uploadFile } = useCloudinaryUploadStandalone(bugId);
  const urls = await Promise.all(files.map((f) => uploadFile(f.file)));
  await fetch('', {});
  // see helper below
}

function useCloudinaryUploadStandalone(bugId: string) {
  // re-use hook outside of a component context via direct call (the hook only uses state for progress
  // which we ignore here)
  return useCloudinaryUpload(bugId);
}

function Step1({
  defaults,
  onNext,
}: {
  defaults: { title?: string; description?: string; severity?: Severity };
  onNext: (v: { title: string; description: string; severity: Severity }) => void;
}) {
  type V = z.infer<typeof step1>;
  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<V>({ resolver: zodResolver(step1), defaultValues: defaults });
  const sev = watch('severity');
  return (
    <form className="space-y-4" onSubmit={handleSubmit(onNext)}>
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} aria-invalid={!!errors.title} />
        {errors.title && <p role="alert" className="text-xs text-sev-critical">{errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...register('description')} aria-invalid={!!errors.description} />
        {errors.description && <p role="alert" className="text-xs text-sev-critical">{errors.description.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="severity">Severity</Label>
        <Select value={sev} onValueChange={(v) => setValue('severity', v as Severity)}>
          <SelectTrigger id="severity" aria-label="Severity">
            <SelectValue placeholder="Choose severity" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.severity && <p role="alert" className="text-xs text-sev-critical">{errors.severity.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}

function Step2({
  defaults,
  onNext,
  onBack,
}: {
  defaults: { stepsToReproduce?: string };
  onNext: (v: { stepsToReproduce: string }) => void;
  onBack: () => void;
}) {
  type V = z.infer<typeof step2>;
  const { register, handleSubmit, formState: { errors } } = useForm<V>({
    resolver: zodResolver(step2),
    defaultValues: defaults,
  });
  return (
    <form className="space-y-4" onSubmit={handleSubmit(onNext)}>
      <div className="space-y-1">
        <Label htmlFor="stepsToReproduce">Steps to reproduce</Label>
        <Textarea id="stepsToReproduce" rows={6} {...register('stepsToReproduce')} aria-invalid={!!errors.stepsToReproduce} />
        {errors.stepsToReproduce && <p role="alert" className="text-xs text-sev-critical">{errors.stepsToReproduce.message}</p>}
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}

function Step3({
  files,
  setFiles,
  onBack,
  onSubmit,
  submitting,
}: {
  files: PendingFile[];
  setFiles: (n: PendingFile[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      <ScreenshotDrop files={files} onChange={setFiles} />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit bug'}
        </Button>
      </div>
    </div>
  );
}
```

> The `uploadAndAttach` helper above uses the cloudinary hook indirectly. Implementation note: in the real wizard, hoist `useCloudinaryUpload` and `useAddScreenshots` to the top of `BugWizard` once `bug.id` is known by passing through state. Adjust to:
>
> ```ts
> const [createdBugId, setCreatedBugId] = useState<string | null>(null);
> const upload = useCloudinaryUpload(createdBugId ?? '_pending');
> const addScreenshots = useAddScreenshots(createdBugId ?? '_pending');
> ```
> Then after `create.mutateAsync`, set `createdBugId` and call upload + attach with that hook. The shape stays the same.

Replace the `Submit bug` handler with a clean version that lifts hooks correctly:

```tsx
const [createdBugId, setCreatedBugId] = useState<string | null>(null);
const upload = useCloudinaryUpload(createdBugId ?? 'pending');
const attach = useAddScreenshots(createdBugId ?? 'pending');

async function submit() {
  try {
    const bug = await create.mutateAsync({
      title: vals.title!,
      description: vals.description!,
      stepsToReproduce: vals.stepsToReproduce!,
      severity: vals.severity!,
    });
    setCreatedBugId(bug.id);
    if (files.length > 0) {
      const urls: string[] = [];
      for (const f of files) urls.push(await upload.uploadFile(f.file));
      await attach.mutateAsync(urls);
    }
    toast.success('Bug submitted');
    nav(`/bugs/${bug.id}`);
  } catch {
    toast.error('Could not submit bug');
  }
}
```

Use `submit` as `onSubmit` in `Step3`. Drop the earlier `uploadAndAttach` placeholder.

- [ ] **Step 5: Install `Textarea` shadcn component**

Run: `cd client && npx shadcn@latest add textarea select`

- [ ] **Step 6: `BugCreatePage.tsx`**

```tsx
import { BugWizard } from '@/components/bugs/BugWizard';

export function BugCreatePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Report a bug</h1>
      <BugWizard />
    </div>
  );
}
```

- [ ] **Step 7: Mount route + RoleGuard**

```tsx
import { BugCreatePage } from '@/pages/BugCreatePage';
import { RoleGuard } from '@/components/auth/RoleGuard';

<Route
  path="/bugs/new"
  element={
    <Authed>
      <RoleGuard allow={['TESTER', 'ADMIN']}>
        <BugCreatePage />
      </RoleGuard>
    </Authed>
  }
/>
```

- [ ] **Step 8: Run tests**

Run: `cd client && npm test -- --run BugCreatePage`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add client/src/components/bugs/BugWizard.tsx client/src/pages/BugCreatePage.tsx client/src/App.tsx client/src/tests/pages/BugCreatePage.test.tsx client/src/tests/msw/handlers.ts client/src/components/ui
git commit -m "feat(client): bug create wizard + screenshot upload"
```

---

## Task 11: TransitionMenu + AssigneeSelector (state-aware)

**Files:**
- Create: `client/src/lib/lifecycle-client.ts`
- Create: `client/src/components/bugs/TransitionMenu.tsx`
- Create: `client/src/components/bugs/AssigneeSelector.tsx`

- [ ] **Step 1: `lifecycle-client.ts` — UI mirror of allowed transitions**

```ts
import type { BugStatus, Role } from '@/types/domain';

export interface AvailableTransition {
  to: BugStatus;
  label: string;
  needsAssignee?: boolean;
  needsPriority?: boolean;
}

export function availableTransitions(args: {
  currentStatus: BugStatus;
  role: Role;
  isAssignee: boolean;
}): AvailableTransition[] {
  const { currentStatus, role, isAssignee } = args;
  const out: AvailableTransition[] = [];
  if (currentStatus === 'NEW' && role === 'ADMIN') {
    out.push({ to: 'ASSIGNED', label: 'Assign...', needsAssignee: true, needsPriority: true });
  }
  if (currentStatus === 'ASSIGNED' && role === 'DEVELOPER' && isAssignee) {
    out.push({ to: 'IN_PROGRESS', label: 'Start work' });
  }
  if (currentStatus === 'IN_PROGRESS' && role === 'DEVELOPER' && isAssignee) {
    out.push({ to: 'FIXED', label: 'Mark fixed' });
  }
  if (currentStatus === 'FIXED' && (role === 'TESTER' || role === 'ADMIN')) {
    out.push({ to: 'VERIFIED', label: 'Verify fix' });
    out.push({ to: 'IN_PROGRESS', label: 'Reject (back to dev)' });
  }
  if (currentStatus === 'VERIFIED' && role === 'ADMIN') {
    out.push({ to: 'CLOSED', label: 'Close' });
  }
  return out;
}
```

- [ ] **Step 2: `AssigneeSelector.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types/domain';

export function AssigneeSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const devs = useQuery({
    queryKey: ['users', 'developers'],
    queryFn: async () => {
      const { data } = await api.get<{ data: User[] }>('/api/users?role=DEVELOPER');
      return data.data;
    },
  });
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Assignee"><SelectValue placeholder="Select developer" /></SelectTrigger>
      <SelectContent>
        {(devs.data ?? []).map((u) => (
          <SelectItem key={u.id} value={u.id}>{u.name} · {u.email}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 3: `TransitionMenu.tsx`**

```tsx
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { availableTransitions, type AvailableTransition } from '@/lib/lifecycle-client';
import { AssigneeSelector } from './AssigneeSelector';
import { useTransitionBug } from '@/hooks/bugs/use-bugs';
import type { Bug, Priority, Role } from '@/types/domain';

const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

export function TransitionMenu({ bug, role, currentUserId }: { bug: Bug; role: Role; currentUserId: string }) {
  const [pending, setPending] = useState<AvailableTransition | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [priority, setPriority] = useState<Priority | undefined>();
  const transition = useTransitionBug(bug.id);

  const options = availableTransitions({
    currentStatus: bug.status,
    role,
    isAssignee: bug.assigneeId === currentUserId,
  });

  if (options.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            Change status <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((o) => (
            <DropdownMenuItem
              key={`${o.to}-${o.label}`}
              onSelect={async () => {
                if (o.needsAssignee || o.needsPriority) {
                  setPending(o);
                  return;
                }
                await runTransition(o);
              }}
            >
              {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {pending?.needsAssignee && (
              <div className="space-y-1">
                <span className="text-xs text-tertiary font-mono">Assignee</span>
                <AssigneeSelector value={assigneeId} onChange={setAssigneeId} />
              </div>
            )}
            {pending?.needsPriority && (
              <div className="space-y-1">
                <span className="text-xs text-tertiary font-mono">Priority</span>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger aria-label="Priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Cancel</Button>
            <Button
              disabled={
                (pending?.needsAssignee && !assigneeId) ||
                (pending?.needsPriority && !priority) ||
                transition.isPending
              }
              onClick={async () => {
                if (!pending) return;
                await runTransition(pending);
                setPending(null);
              }}
            >
              {transition.isPending ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  async function runTransition(o: AvailableTransition) {
    try {
      await transition.mutateAsync({
        to: o.to,
        ...(o.needsAssignee && { assigneeId }),
        ...(o.needsPriority && { priority }),
      });
      toast.success(`Status → ${o.to}`);
    } catch {
      toast.error('Transition rejected');
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/lifecycle-client.ts client/src/components/bugs/TransitionMenu.tsx client/src/components/bugs/AssigneeSelector.tsx
git commit -m "feat(client): state-aware transition menu + assignee selector"
```

---

## Task 12: CommentThread + CommentEditor

**Files:**
- Create: `client/src/components/comments/CommentThread.tsx`
- Create: `client/src/components/comments/CommentItem.tsx`
- Create: `client/src/components/comments/CommentEditor.tsx`

- [ ] **Step 1: `CommentEditor.tsx`**

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function CommentEditor({
  initial = '',
  submitting,
  onSubmit,
  onCancel,
  cta = 'Post comment',
}: {
  initial?: string;
  submitting: boolean;
  onSubmit: (text: string) => void | Promise<void>;
  onCancel?: () => void;
  cta?: string;
}) {
  const [text, setText] = useState(initial);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
      }}
    >
      <Textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Comment text"
        placeholder="Add a comment..."
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting || !text.trim()}>
          {submitting ? 'Posting…' : cta}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: `CommentItem.tsx`**

```tsx
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CommentEditor } from './CommentEditor';
import { useUpdateComment, useDeleteComment } from '@/hooks/bugs/use-comments';
import type { Comment, Role } from '@/types/domain';

export function CommentItem({
  comment,
  currentUserId,
  currentRole,
}: {
  comment: Comment;
  currentUserId: string;
  currentRole: Role;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateComment(comment.bugId, comment.id);
  const del = useDeleteComment(comment.bugId, comment.id);
  const isAuthor = comment.authorId === currentUserId;
  const canDelete = isAuthor || currentRole === 'ADMIN';
  const canEdit = isAuthor;

  return (
    <article className="rounded-lg border border-default bg-surface p-4">
      <header className="flex items-center justify-between text-xs text-tertiary font-mono">
        <span>
          <strong className="text-secondary">{comment.author?.name ?? 'unknown'}</strong> ·{' '}
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </span>
        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Comment actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onSelect={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onSelect={async () => {
                    if (!confirm('Delete this comment?')) return;
                    try {
                      await del.mutateAsync();
                      toast.success('Comment deleted');
                    } catch {
                      toast.error('Could not delete');
                    }
                  }}
                  className="text-sev-critical"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {editing ? (
        <div className="mt-3">
          <CommentEditor
            initial={comment.text}
            submitting={update.isPending}
            cta="Save"
            onCancel={() => setEditing(false)}
            onSubmit={async (text) => {
              try {
                await update.mutateAsync(text);
                toast.success('Comment updated');
                setEditing(false);
              } catch {
                toast.error('Could not update');
              }
            }}
          />
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-primary">{comment.text}</p>
      )}
    </article>
  );
}
```

- [ ] **Step 3: `CommentThread.tsx`**

```tsx
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentItem } from './CommentItem';
import { CommentEditor } from './CommentEditor';
import { useComments, useCreateComment } from '@/hooks/bugs/use-comments';
import { useMe } from '@/hooks/use-auth';

export function CommentThread({ bugId }: { bugId: string }) {
  const list = useComments(bugId);
  const create = useCreateComment(bugId);
  const me = useMe();
  if (!me.data) return null;

  return (
    <section className="space-y-4" aria-label="Comments">
      <h2 className="font-display text-base">Comments</h2>
      {list.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="space-y-3">
          {(list.data ?? []).map((c) => (
            <li key={c.id}>
              <CommentItem comment={c} currentUserId={me.data!.id} currentRole={me.data!.role} />
            </li>
          ))}
        </ul>
      )}
      <CommentEditor
        submitting={create.isPending}
        onSubmit={async (text) => {
          try {
            await create.mutateAsync(text);
            toast.success('Comment posted');
          } catch {
            toast.error('Could not post');
          }
        }}
      />
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/comments
git commit -m "feat(client): comment thread with edit/delete"
```

---

## Task 13: BugDetailPage + BugMetaPanel + BugTimeline

**Files:**
- Create: `client/src/components/bugs/BugMetaPanel.tsx`
- Create: `client/src/components/bugs/BugTimeline.tsx`
- Create: `client/src/pages/BugDetailPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: `BugMetaPanel.tsx`**

```tsx
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
```

- [ ] **Step 2: `BugTimeline.tsx`** (description + steps + screenshots + comments)

```tsx
import type { Bug } from '@/types/domain';
import { ScreenshotGallery } from './ScreenshotGallery';
import { CommentThread } from '@/components/comments/CommentThread';

export function BugTimeline({ bug }: { bug: Bug }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-default bg-surface p-5">
        <h2 className="font-display text-base mb-2">Description</h2>
        <p className="whitespace-pre-wrap text-sm text-secondary">{bug.description}</p>
      </section>
      <section className="rounded-xl border border-default bg-surface p-5">
        <h2 className="font-display text-base mb-2">Steps to reproduce</h2>
        <pre className="whitespace-pre-wrap font-mono text-xs text-secondary">{bug.stepsToReproduce}</pre>
      </section>
      {bug.screenshots.length > 0 && (
        <section className="rounded-xl border border-default bg-surface p-5">
          <h2 className="font-display text-base mb-3">Screenshots</h2>
          <ScreenshotGallery urls={bug.screenshots} />
        </section>
      )}
      <CommentThread bugId={bug.id} />
    </div>
  );
}
```

- [ ] **Step 3: `BugDetailPage.tsx`**

```tsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBug, useDeleteBug } from '@/hooks/bugs/use-bugs';
import { useMe } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BugMetaPanel } from '@/components/bugs/BugMetaPanel';
import { BugTimeline } from '@/components/bugs/BugTimeline';
import { TransitionMenu } from '@/components/bugs/TransitionMenu';

export function BugDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const bug = useBug(id);
  const del = useDeleteBug();
  const nav = useNavigate();

  if (bug.isLoading || !me.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (bug.isError || !bug.data) {
    return (
      <div className="text-secondary">
        Bug not found.{' '}
        <Link to="/bugs" className="text-accent underline">Back to list</Link>
      </div>
    );
  }

  const isAdmin = me.data.role === 'ADMIN';

  return (
    <div className="space-y-4">
      <Link to="/bugs" className="inline-flex items-center gap-1 text-xs text-tertiary hover:text-primary">
        <ArrowLeft className="h-3 w-3" /> Back to bugs
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">{bug.data.title}</h1>
          <p className="text-xs text-tertiary font-mono">#{bug.data.id.slice(0, 8)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TransitionMenu bug={bug.data} role={me.data.role} currentUserId={me.data.id} />
          {isAdmin && (
            <Button
              variant="outline"
              className="gap-2 text-sev-critical"
              onClick={async () => {
                if (!confirm('Delete this bug? This cannot be undone.')) return;
                try {
                  await del.mutateAsync(bug.data!.id);
                  toast.success('Bug deleted');
                  nav('/bugs');
                } catch {
                  toast.error('Could not delete');
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </header>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 min-w-0"><BugTimeline bug={bug.data} /></div>
        <BugMetaPanel bug={bug.data} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Mount route + add `/bugs/:id/edit`**

```tsx
import { BugDetailPage } from '@/pages/BugDetailPage';
<Route path="/bugs/:id" element={<Authed><BugDetailPage /></Authed>} />
```

(Edit page is straightforward; deferred to Plan 6 polish if time allows. The detail page already exposes `useUpdateBug`-friendly metadata.)

- [ ] **Step 5: Manual smoke**

Run dev. Login as admin. From dashboard click a recent bug → detail loads → assign it → as developer (login swap) start work → mark fixed → as tester verify → as admin close. Confirm optimistic update + toast each step.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/bugs/BugMetaPanel.tsx client/src/components/bugs/BugTimeline.tsx client/src/pages/BugDetailPage.tsx client/src/App.tsx
git commit -m "feat(client): bug detail with transitions + comments + screenshots"
```

---

## Done — Plan 5 acceptance

- [ ] Dashboard shows live KPI counts and 8 most recent bugs
- [ ] `/bugs` lists with URL-synced filters (deep-linkable), paginated, virtualized at 50+ rows
- [ ] Bug create wizard: 3 steps, validates per step, uploads screenshots to Cloudinary, navigates to detail on success
- [ ] Bug detail: meta panel + description + steps + gallery + comments
- [ ] State-aware TransitionMenu only shows allowed transitions for the actor's role+assignment
- [ ] Optimistic UI on transitions, rollback toast on rejection
- [ ] Comments thread: post, edit (author), delete (author or admin)
- [ ] Lightbox keyboard nav (Esc/←/→) works
- [ ] All a11y smoke tests pass; CI green
