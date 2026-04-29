# Plan 6 — Admin UI + Analytics + Polish + Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the admin pages (`/users`, `/analytics`), polish the app (command palette, keyboard shortcuts, empty/error edge cases), deploy to free cloud (Vercel + Render + Neon + Cloudinary), and write a viva-ready README.

**Architecture:** Adds two admin-only pages, the cmdk command palette wired into the AppShell, and config files for the three hosting providers. Charts use `recharts` (lazy-loaded). Final commit lands a polished README with screenshots, lifecycle diagram, and deploy URLs.

**Tech Stack:** Plan 4–5 stack + `recharts` (charts), `cmdk` (command palette).

**Prereqs:** Plans 1–5 complete; CI green.

---

## File Structure

```
client/src/
├── pages/
│   ├── UsersPage.tsx
│   ├── AnalyticsPage.tsx
│   └── BugEditPage.tsx
├── components/
│   ├── admin/
│   │   ├── UserRow.tsx
│   │   └── RoleChangeDialog.tsx
│   ├── analytics/
│   │   ├── BugStatusChart.tsx
│   │   ├── SeverityDonut.tsx
│   │   └── DeveloperLeaderboard.tsx
│   └── shell/
│       ├── CommandPalette.tsx
│       └── KeyboardShortcuts.tsx
└── hooks/
    ├── use-users.ts
    └── use-stats.ts

# deploy
client/vercel.json
server/render.yaml
README.md                          (rewritten)
docs/superpowers/diagrams/         (architecture + lifecycle PNGs/mermaid)
```

---

## Task 1: Users API hooks

**Files:**
- Create: `client/src/hooks/use-users.ts`

- [ ] **Step 1: Write hook**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Role, User } from '@/types/domain';

const keys = {
  list: (role?: Role) => ['users', 'list', role ?? null] as const,
};

export function useUsers(role?: Role) {
  return useQuery({
    queryKey: keys.list(role),
    queryFn: async () => {
      const { data } = await api.get<{ data: User[] }>('/api/users', {
        params: role ? { role } : undefined,
      });
      return data.data;
    },
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { data } = await api.patch<{ user: User }>(`/api/users/${id}/role`, { role });
      return data.user;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/use-users.ts
git commit -m "feat(client): users hooks"
```

---

## Task 2: UsersPage with RoleChangeDialog

**Files:**
- Create: `client/src/components/admin/UserRow.tsx`
- Create: `client/src/components/admin/RoleChangeDialog.tsx`
- Create: `client/src/pages/UsersPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: `UserRow.tsx`**

```tsx
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/domain';

const roleLabel: Record<User['role'], string> = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  TESTER: 'Tester',
};

export function UserRow({
  user,
  onChangeRole,
  isSelf,
}: {
  user: User;
  onChangeRole: () => void;
  isSelf: boolean;
}) {
  return (
    <li className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 border-b border-default px-4 py-3 min-h-[56px]">
      <div className="min-w-0">
        <p className="truncate font-display text-sm">{user.name}</p>
        <p className="truncate text-xs text-tertiary">{user.email}</p>
      </div>
      <span className="font-mono text-xs">{roleLabel[user.role]}</span>
      <span className="font-mono text-xs text-tertiary">
        {format(new Date(user.createdAt), 'PP')}
      </span>
      <Button size="sm" variant="outline" onClick={onChangeRole} disabled={isSelf}>
        Change role
      </Button>
    </li>
  );
}
```

- [ ] **Step 2: `RoleChangeDialog.tsx`**

```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useChangeRole } from '@/hooks/use-users';
import type { Role, User } from '@/types/domain';

const ROLES: Role[] = ['TESTER', 'DEVELOPER', 'ADMIN'];

export function RoleChangeDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [role, setRole] = useState<Role>(user?.role ?? 'TESTER');
  const change = useChangeRole();
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role — {user.name}</DialogTitle>
        </DialogHeader>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger aria-label="New role"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={change.isPending || role === user.role}
            onClick={async () => {
              try {
                await change.mutateAsync({ id: user.id, role });
                toast.success('Role updated');
                onOpenChange(false);
              } catch {
                toast.error('Could not update role');
              }
            }}
          >
            {change.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: `UsersPage.tsx`**

```tsx
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsers } from '@/hooks/use-users';
import { useMe } from '@/hooks/use-auth';
import { UserRow } from '@/components/admin/UserRow';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import type { User } from '@/types/domain';

export function UsersPage() {
  const me = useMe();
  const list = useUsers();
  const [editing, setEditing] = useState<User | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Users</h1>
      <div className="rounded-xl border border-default bg-surface">
        <header className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 border-b border-default px-4 py-2 text-xs uppercase tracking-wider text-tertiary font-mono">
          <span>User</span><span>Role</span><span>Joined</span><span></span>
        </header>
        {list.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <ul>
            {(list.data ?? []).map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === me.data?.id}
                onChangeRole={() => setEditing(u)}
              />
            ))}
          </ul>
        )}
      </div>
      <RoleChangeDialog
        user={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Mount in `App.tsx`** (admin only)

```tsx
import { UsersPage } from '@/pages/UsersPage';
<Route
  path="/users"
  element={
    <Authed>
      <RoleGuard allow={['ADMIN']}>
        <UsersPage />
      </RoleGuard>
    </Authed>
  }
/>
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/admin client/src/pages/UsersPage.tsx client/src/App.tsx
git commit -m "feat(client): /users admin page + role change"
```

---

## Task 3: Stats hooks

**Files:**
- Create: `client/src/hooks/use-stats.ts`

- [ ] **Step 1: Write hook**

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BugStatus, Severity, Priority, User } from '@/types/domain';

export interface SummaryResponse {
  total: number;
  byStatus: Record<BugStatus, number>;
  bySeverity: Record<Severity, number>;
  byPriority: Record<Priority, number>;
}

export interface DeveloperStat {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  assigned: number;
  fixed: number;
  avgFixHours: number | null;
}

export function useStatsSummary() {
  return useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<SummaryResponse>('/api/stats/summary');
      return data;
    },
  });
}

export function useDeveloperStats() {
  return useQuery({
    queryKey: ['stats', 'developers'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DeveloperStat[] }>('/api/stats/developers');
      return data.data;
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/hooks/use-stats.ts
git commit -m "feat(client): stats hooks"
```

---

## Task 4: Charts (Bar status, Donut severity) + DeveloperLeaderboard

**Files:**
- Create: `client/src/components/analytics/BugStatusChart.tsx`
- Create: `client/src/components/analytics/SeverityDonut.tsx`
- Create: `client/src/components/analytics/DeveloperLeaderboard.tsx`
- Add dep: `recharts`

- [ ] **Step 1: Install**

Run: `cd client && npm install recharts@2.13.3`

- [ ] **Step 2: `BugStatusChart.tsx`**

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SummaryResponse } from '@/hooks/use-stats';

export function BugStatusChart({ data }: { data: SummaryResponse['byStatus'] }) {
  const rows = Object.entries(data).map(([status, count]) => ({ status, count }));
  return (
    <div className="rounded-xl border border-default bg-surface p-5">
      <h2 className="font-display text-base mb-3">Bugs by status</h2>
      <div className="h-64" aria-label="Bar chart of bugs by status">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
            <XAxis dataKey="status" stroke="rgb(var(--text-tertiary))" fontSize={11} />
            <YAxis stroke="rgb(var(--text-tertiary))" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'rgb(var(--bg-elevated))',
                border: '1px solid rgb(var(--border))',
                color: 'rgb(var(--text-primary))',
                fontFamily: 'JetBrains Mono Variable',
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="rgb(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `SeverityDonut.tsx`**

```tsx
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
```

- [ ] **Step 4: `DeveloperLeaderboard.tsx`**

```tsx
import type { DeveloperStat } from '@/hooks/use-stats';

export function DeveloperLeaderboard({ rows }: { rows: DeveloperStat[] }) {
  const sorted = [...rows].sort((a, b) => b.fixed - a.fixed);
  return (
    <section className="rounded-xl border border-default bg-surface" aria-label="Developer performance">
      <header className="border-b border-default px-5 py-3">
        <h2 className="font-display text-base">Developer performance</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-tertiary font-mono">
              <th className="px-5 py-2">Developer</th>
              <th className="px-3 py-2 text-right">Assigned</th>
              <th className="px-3 py-2 text-right">Fixed</th>
              <th className="px-5 py-2 text-right">Avg fix (hrs)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-tertiary">
                  No developers yet.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.user.id} className="border-t border-default">
                  <td className="px-5 py-3">
                    <p className="font-display">{r.user.name}</p>
                    <p className="text-xs text-tertiary">{r.user.email}</p>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-mono">{r.assigned}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-mono">{r.fixed}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-mono">
                    {r.avgFixHours == null ? '—' : r.avgFixHours.toFixed(1)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/analytics client/package.json client/package-lock.json
git commit -m "feat(client): analytics charts + leaderboard"
```

---

## Task 5: AnalyticsPage (admin only)

**Files:**
- Create: `client/src/pages/AnalyticsPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: `AnalyticsPage.tsx`**

```tsx
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useStatsSummary, useDeveloperStats } from '@/hooks/use-stats';
import { KpiCard } from '@/components/common/KpiCard';

const BugStatusChart = lazy(() =>
  import('@/components/analytics/BugStatusChart').then((m) => ({ default: m.BugStatusChart })),
);
const SeverityDonut = lazy(() =>
  import('@/components/analytics/SeverityDonut').then((m) => ({ default: m.SeverityDonut })),
);
const DeveloperLeaderboard = lazy(() =>
  import('@/components/analytics/DeveloperLeaderboard').then((m) => ({
    default: m.DeveloperLeaderboard,
  })),
);

export function AnalyticsPage() {
  const summary = useStatsSummary();
  const devs = useDeveloperStats();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl">Analytics</h1>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total" value={summary.data?.total ?? <Skeleton className="h-8 w-12" />} />
        <KpiCard label="Open" value={(summary.data?.byStatus.NEW ?? 0) + (summary.data?.byStatus.ASSIGNED ?? 0) + (summary.data?.byStatus.IN_PROGRESS ?? 0)} />
        <KpiCard label="Fixed" value={summary.data?.byStatus.FIXED ?? 0} />
        <KpiCard label="Closed" value={summary.data?.byStatus.CLOSED ?? 0} />
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          {summary.data && <BugStatusChart data={summary.data.byStatus} />}
        </Suspense>
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          {summary.data && <SeverityDonut data={summary.data.bySeverity} />}
        </Suspense>
      </section>
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        {devs.data && <DeveloperLeaderboard rows={devs.data} />}
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Mount route**

```tsx
import { AnalyticsPage } from '@/pages/AnalyticsPage';
<Route
  path="/analytics"
  element={
    <Authed>
      <RoleGuard allow={['ADMIN']}>
        <AnalyticsPage />
      </RoleGuard>
    </Authed>
  }
/>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/AnalyticsPage.tsx client/src/App.tsx
git commit -m "feat(client): analytics page (admin) with lazy charts"
```

---

## Task 6: Command palette (cmdk) + keyboard shortcuts

**Files:**
- Create: `client/src/components/shell/CommandPalette.tsx`
- Create: `client/src/components/shell/KeyboardShortcuts.tsx`
- Modify: `client/src/components/shell/AppShell.tsx`
- Modify: `client/src/components/shell/TopBar.tsx`
- Add deps: `cmdk`

- [ ] **Step 1: Install**

Run: `cd client && npm install cmdk@1.0.4`

Run: `cd client && npx shadcn@latest add command`

- [ ] **Step 2: `CommandPalette.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { LayoutDashboard, Bug, Plus, BarChart3, Users, User } from 'lucide-react';
import { useMe } from '@/hooks/use-auth';

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const nav = useNavigate();
  const me = useMe();
  const isAdmin = me.data?.role === 'ADMIN';
  const canCreate = me.data?.role === 'ADMIN' || me.data?.role === 'TESTER';
  const go = (path: string) => {
    onOpenChange(false);
    nav(path);
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/bugs')}>
            <Bug className="mr-2 h-4 w-4" /> Bugs
          </CommandItem>
          <CommandItem onSelect={() => go('/profile')}>
            <User className="mr-2 h-4 w-4" /> Profile
          </CommandItem>
          {isAdmin && (
            <>
              <CommandItem onSelect={() => go('/analytics')}>
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
              </CommandItem>
              <CommandItem onSelect={() => go('/users')}>
                <Users className="mr-2 h-4 w-4" /> Users
              </CommandItem>
            </>
          )}
        </CommandGroup>
        {canCreate && (
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go('/bugs/new')}>
              <Plus className="mr-2 h-4 w-4" /> New bug
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPaletteHotkey(setOpen: (v: boolean) => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpen]);
}
```

- [ ] **Step 3: `KeyboardShortcuts.tsx`** (`c` → new bug; arrow keys handled inside list when focused — kept minimal)

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '@/hooks/use-auth';

export function KeyboardShortcuts() {
  const nav = useNavigate();
  const me = useMe();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
          return;
        }
      }
      if (e.key === 'c' && (me.data?.role === 'TESTER' || me.data?.role === 'ADMIN')) {
        nav('/bugs/new');
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [me.data?.role, nav]);
  return null;
}
```

- [ ] **Step 4: Wire palette into `AppShell.tsx`**

```tsx
import { useState } from 'react';
import { CommandPalette, useCommandPaletteHotkey } from './CommandPalette';
import { KeyboardShortcuts } from './KeyboardShortcuts';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useCommandPaletteHotkey(setPaletteOpen);
  return (
    <div className="min-h-screen flex flex-col">
      {/* SkipLink, TopBar (pass onSearch), SideNav, BottomNav, main wrapper as before */}
      {/* TopBar: <TopBar onSearch={() => setPaletteOpen(true)} /> */}
      {/* ... */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <KeyboardShortcuts />
    </div>
  );
}
```

(Adjust the existing AppShell to wire `setPaletteOpen` into `<TopBar onSearch={...} />`.)

- [ ] **Step 5: Manual smoke**

Run dev. Press `⌘K` (or `Ctrl+K`). Palette opens. Type "an" → "Analytics" surfaces (admin). Press Enter — navigates. Press `c` (not in input) → `/bugs/new`.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/shell client/package.json client/package-lock.json client/src/components/ui
git commit -m "feat(client): command palette + keyboard shortcuts"
```

---

## Task 7: BugEditPage (reporter, NEW only)

**Files:**
- Create: `client/src/pages/BugEditPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: `BugEditPage.tsx`**

```tsx
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useBug, useUpdateBug } from '@/hooks/bugs/use-bugs';
import { useMe } from '@/hooks/use-auth';

const schema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  stepsToReproduce: z.string().min(5).max(2000),
});
type V = z.infer<typeof schema>;

export function BugEditPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const bug = useBug(id);
  const update = useUpdateBug(id ?? '');
  const nav = useNavigate();

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<V>({
    resolver: zodResolver(schema),
    values: bug.data && {
      title: bug.data.title,
      description: bug.data.description,
      stepsToReproduce: bug.data.stepsToReproduce,
    },
  });

  if (bug.isLoading || !me.data) return <Skeleton className="h-40 w-full" />;
  if (!bug.data) return <p>Not found.</p>;

  const isReporter = bug.data.reporterId === me.data.id;
  const isAdmin = me.data.role === 'ADMIN';
  const canEdit = (isReporter || isAdmin) && bug.data.status === 'NEW';
  if (!canEdit) {
    return (
      <p className="text-secondary">
        This bug can no longer be edited.{' '}
        <Link to={`/bugs/${bug.data.id}`} className="text-accent underline">Back</Link>
      </p>
    );
  }

  const onSubmit = handleSubmit(async (vals) => {
    try {
      await update.mutateAsync(vals);
      toast.success('Bug updated');
      nav(`/bugs/${bug.data!.id}`);
    } catch {
      toast.error('Could not update');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
      <h1 className="font-display text-xl">Edit bug</h1>
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
        <Label htmlFor="stepsToReproduce">Steps to reproduce</Label>
        <Textarea id="stepsToReproduce" rows={6} {...register('stepsToReproduce')} aria-invalid={!!errors.stepsToReproduce} />
        {errors.stepsToReproduce && <p role="alert" className="text-xs text-sev-critical">{errors.stepsToReproduce.message}</p>}
      </div>
      <div className="flex gap-2 justify-end">
        <Link to={`/bugs/${bug.data.id}`}>
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Mount route**

```tsx
import { BugEditPage } from '@/pages/BugEditPage';
<Route path="/bugs/:id/edit" element={<Authed><BugEditPage /></Authed>} />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/BugEditPage.tsx client/src/App.tsx
git commit -m "feat(client): bug edit page (reporter, NEW only)"
```

---

## Task 8: Vercel client deploy config

**Files:**
- Create: `client/vercel.json`
- Modify: `client/.env.example`

- [ ] **Step 1: `client/vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Document env in `client/.env.example`**

```bash
# Set these in Vercel project settings (Production + Preview).
VITE_API_URL=https://<your-render-host>.onrender.com
```

- [ ] **Step 3: Manual deploy steps (documented in README, executed by you)**

```
1. Push branch to GitHub
2. vercel.com → New Project → import repo, set root to client/
3. Set env VITE_API_URL = https://<your-render-host>.onrender.com
4. Deploy
```

- [ ] **Step 4: Commit**

```bash
git add client/vercel.json client/.env.example
git commit -m "chore(client): vercel deploy config"
```

---

## Task 9: Render server deploy config + production hardening

**Files:**
- Create: `server/render.yaml`
- Modify: `server/src/app.ts` (production CORS + secure cookie)
- Modify: `server/.env.example`

- [ ] **Step 1: `server/render.yaml`**

```yaml
services:
  - type: web
    name: bugfix-server
    runtime: node
    region: oregon
    plan: free
    rootDir: server
    buildCommand: npm ci && npx prisma generate && npm run build && npx prisma migrate deploy
    startCommand: node dist/index.js
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: CLIENT_ORIGIN
        sync: false
      - key: COOKIE_DOMAIN
        sync: false
      - key: COOKIE_SECURE
        value: 'true'
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
```

- [ ] **Step 2: Tighten CORS in `app.ts`** (allow only the client origin; already configured, but verify `credentials: true`)

```ts
app.use(
  cors({
    origin: env.CLIENT_ORIGIN, // exact origin, not '*'
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);
```

Add `app.set('trust proxy', 1);` near the top of `createApp()` so `secure` cookies work behind Render's proxy.

- [ ] **Step 3: Update `server/.env.example`** (add inline notes)

```bash
# In production:
#   CLIENT_ORIGIN=https://<your-vercel-host>.vercel.app
#   COOKIE_SECURE=true
#   COOKIE_DOMAIN=
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://bugfix:bugfix@localhost:5432/bugfix_dev
JWT_SECRET=change-me-32-bytes-minimum-please-replace
CLIENT_ORIGIN=http://localhost:5173
COOKIE_DOMAIN=
COOKIE_SECURE=false
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- [ ] **Step 4: Manual Neon + Render setup (documented; executed by you)**

```
1. neon.tech → create project + database → copy pooled connection string
2. render.com → New → Web Service → connect repo → render.yaml is detected
3. Set DATABASE_URL = neon pooled URL
4. Set CLIENT_ORIGIN = https://<your-vercel-host>.vercel.app
5. Add CLOUDINARY_* secrets
6. First deploy runs prisma migrate deploy automatically
```

After it's live, run a one-off seed via Render shell: `npm run seed`.

- [ ] **Step 5: Commit**

```bash
git add server/render.yaml server/src/app.ts server/.env.example
git commit -m "chore(server): render deploy config + prod hardening"
```

---

## Task 10: Lifecycle + architecture diagrams (mermaid)

**Files:**
- Create: `docs/superpowers/diagrams/lifecycle.md`
- Create: `docs/superpowers/diagrams/architecture.md`

- [ ] **Step 1: `lifecycle.md`**

````markdown
# Bug lifecycle

```mermaid
stateDiagram-v2
  [*] --> NEW: tester reports
  NEW --> ASSIGNED: admin assigns (priority required)
  ASSIGNED --> IN_PROGRESS: developer (assignee) starts
  IN_PROGRESS --> FIXED: developer marks fixed
  FIXED --> VERIFIED: tester verifies
  FIXED --> IN_PROGRESS: tester rejects
  VERIFIED --> CLOSED: admin closes
  CLOSED --> [*]
```
````

- [ ] **Step 2: `architecture.md`**

````markdown
# Architecture

```mermaid
flowchart LR
  subgraph Client [Vercel — React + Vite]
    UI[React UI<br/>Tailwind + shadcn]
  end
  subgraph Server [Render — Node + Express]
    API[Express API<br/>JWT, zod, helmet]
  end
  subgraph DB [Neon — PostgreSQL]
    PG[(Postgres)]
  end
  subgraph Files [Cloudinary]
    Cloud[(Image storage)]
  end

  UI -- HTTPS + httpOnly cookie --> API
  UI -- direct signed upload --> Cloud
  API -- Prisma ORM --> PG
  API -- signed payload --> Cloud
```
````

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/diagrams
git commit -m "docs: add lifecycle + architecture diagrams"
```

---

## Task 11: Rewrite README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`**

```markdown
# Bug Fix Web App — "Field Report"

Web-based bug tracker. Three roles (admin / developer / tester), full lifecycle (NEW → CLOSED) with enforced state machine, Cloudinary screenshots, comments, and analytics.

> **Live demo:** `https://<vercel-host>.vercel.app`
> **API:** `https://<render-host>.onrender.com`
> **Spec:** [`docs/superpowers/specs/2026-04-27-bug-fix-web-app-design.md`](docs/superpowers/specs/2026-04-27-bug-fix-web-app-design.md)

## Stack

- **Client:** React 18, Vite, TypeScript, Tailwind, shadcn/ui, react-query, react-hook-form + zod, framer-motion, recharts
- **Server:** Node 20, Express, TypeScript, Prisma 5, PostgreSQL 16, JWT (httpOnly cookies), bcrypt, zod, helmet, express-rate-limit
- **Files:** Cloudinary (signed direct upload)
- **Tests:** Jest + Supertest (server), Vitest + RTL + MSW + jest-axe (client)
- **CI:** GitHub Actions (lint + typecheck + tests + build)
- **Deploy:** Vercel (client), Render (server), Neon (DB), Cloudinary (files)

## Quick start (local)

```bash
# 1. Spin up Postgres (dev + test)
npm run db:up

# 2. Server
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev   # :4000

# 3. Client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev   # :5173
```

Open `http://localhost:5173`. Seeded credentials:

| Role      | Email                  | Password   |
|-----------|------------------------|------------|
| Admin     | admin@bugfix.local     | Admin1234  |
| Developer | dev1@bugfix.local      | Dev12345   |
| Tester    | tester1@bugfix.local   | Test1234   |

## Architecture

See [`docs/superpowers/diagrams/architecture.md`](docs/superpowers/diagrams/architecture.md) and [`docs/superpowers/diagrams/lifecycle.md`](docs/superpowers/diagrams/lifecycle.md).

## Bug lifecycle

```
NEW → ASSIGNED → IN_PROGRESS → FIXED → VERIFIED → CLOSED
                          ↑          ↓
                          └── reject ┘
```

Server enforces every transition based on role + assignee.

## Project layout

```
.
├── client/                  React + Vite SPA
├── server/                  Express + Prisma API
├── docs/superpowers/
│   ├── specs/               design spec
│   ├── plans/               6 implementation plans
│   └── diagrams/            mermaid diagrams
├── docker-compose.yml       Postgres for dev + test
└── .github/workflows/ci.yml lint + typecheck + tests + build
```

## Tests

```bash
# Server (uses test DB on :5433)
cd server && npm test

# Client
cd client && npm test
```

## Deploy

See task instructions in [Plan 6](docs/superpowers/plans/2026-04-27-plan-6-admin-deploy.md):
1. Provision Neon Postgres → copy pooled connection string
2. Render → import repo (`render.yaml` auto-detected) → set secrets
3. Vercel → import repo, root `client/`, set `VITE_API_URL`
4. After first deploy, run `npm run seed` via Render shell

## Security highlights

- bcrypt cost 12, JWT HS256 (32-byte+ secret)
- httpOnly + Secure + SameSite=Lax session cookie
- helmet defaults (CSP, HSTS, frame-deny)
- CORS allowlist (only client origin)
- Login rate-limit (5/min/IP)
- All inputs validated by zod
- Prisma parameterizes every query
- Cloudinary signed-upload (server signs; client uploads directly)
- Server is authoritative on every role + ownership check; UI gating is cosmetic

## License

MIT
```

- [ ] **Step 2: (Optional) Add screenshots to repo**

Save 3–4 screenshots to `docs/screenshots/` (`dashboard.png`, `bug-list.png`, `bug-detail.png`, `analytics.png`) and reference them in the README under a `## Screenshots` section. Skip if running out of time.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with deploy + demo info"
```

---

## Task 12: Final pass — empty/error edge cases

**Files:**
- Modify: `client/src/components/auth/AuthGuard.tsx` (handle network errors gracefully)
- Modify: `client/src/App.tsx` (wrap in error boundary)
- Create: `client/src/components/common/ErrorBoundary.tsx`

- [ ] **Step 1: `ErrorBoundary.tsx`**

```tsx
import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface State { hasError: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: Error) {
    console.error('UI error:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-xl px-6 py-24">
          <h1 className="font-display text-2xl mb-2">Something went wrong</h1>
          <p className="text-secondary mb-4">An unexpected error occurred. Try refreshing.</p>
          <Link to="/dashboard" className="text-accent underline">Back to dashboard</Link>
        </main>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap in `App.tsx`**

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        {/* existing <Routes> */}
      </ErrorBoundary>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/common/ErrorBoundary.tsx client/src/App.tsx
git commit -m "feat(client): top-level error boundary"
```

---

## Done — Plan 6 acceptance

- [ ] `/users` lists all users; admin can change roles via dialog (cannot demote self)
- [ ] `/analytics` shows KPIs + bar chart (status) + donut (severity) + developer leaderboard
- [ ] Charts lazy-loaded (separate chunk)
- [ ] `⌘K` opens command palette; `c` from anywhere (not in inputs) → `/bugs/new`
- [ ] `/bugs/:id/edit` works only for reporter or admin while status = NEW
- [ ] Error boundary renders fallback UI on JS exceptions
- [ ] Vercel deploy config + Render deploy config committed
- [ ] README rewritten with stack, quick start, demo creds, deploy, security
- [ ] Diagrams committed
- [ ] Live URLs filled into README after first successful deploy
- [ ] All Plan 1–6 tests green; CI green

---

## Suggested execution order across all 6 plans

1. Plan 1 — Foundation + Auth (server)
2. Plan 2 — Bugs core (server)
3. Plan 3 — Comments + Analytics (server)
4. Plan 4 — Client shell + design system + auth pages
5. Plan 5 — Client bug pages
6. Plan 6 — Admin + analytics + polish + deploy

After Plan 6 lands and is merged: deploy → smoke test live URLs → update README with the actual hostnames → final commit.
