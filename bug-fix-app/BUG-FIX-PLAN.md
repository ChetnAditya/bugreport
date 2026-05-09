# BugFix App — UI Bug Fix Plan

> Generated after full UI test run against ONBOARDING.md (2026-04-30).
> All file paths are relative to the repo root.

---

## Findings Summary

| # | Severity | Description | Status |
|---|----------|-------------|--------|
| 1 | High | SideNav only shows Dashboard + Bugs for all roles | Open |
| 2 | Low | ONBOARDING.md documents `/org` but app route is `/org-chart` | Open |
| 3 | Critical | "Change status" button missing on bug detail for all roles | Open |
| 4 | Medium | "New bug" button not shown for TEAMLEAD on `/bugs` | Open |
| 5 | High | DEVELOPER sees 0 bugs on `/bugs` | Open |
| 6 | Low | "Report a bug" link shown to DEVELOPER on empty dashboard | Open |

---

## Fix 1 — SideNav: restore Teams / Users / Org links per role

**File:** `client/src/components/shell/SideNav.tsx`

### Root cause

`isSuperadmin` is declared but never used. `Teams` and `Users` items have
`lead: false`, which makes them visible to *everyone*, but their routes are
SUPERADMIN-only. The missing guard means the links are never shown (the filter
logic suppresses them when `isLead` is false on first render) or leads non-admin
users into a 403.

### Change

Add a `superadmin` flag to every nav item and update the filter predicate.

```ts
// Before
const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, lead: false },
  { to: '/bugs',      label: 'Bugs',      icon: Bug,             lead: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart3,       lead: true  },
  { to: '/users',     label: 'Users',     icon: Users,           lead: false },
  { to: '/teams',     label: 'Teams',     icon: UsersRound,      lead: false },
  { to: '/org-chart', label: 'Org Chart', icon: Network,         lead: true  },
];

.filter((i) => !i.lead || isLead)
```

```ts
// After
const items = [
  { to: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard, lead: false, superadmin: false },
  { to: '/bugs',       label: 'Bugs',      icon: Bug,             lead: false, superadmin: false },
  { to: '/analytics',  label: 'Analytics', icon: BarChart3,       lead: true,  superadmin: false },
  { to: '/org-chart',  label: 'Org Chart', icon: Network,         lead: true,  superadmin: false },
  { to: '/users',      label: 'Users',     icon: Users,           lead: false, superadmin: true  },
  { to: '/teams',      label: 'Teams',     icon: UsersRound,      lead: false, superadmin: true  },
];

.filter((i) => (!i.lead || isLead) && (!i.superadmin || isSuperadmin))
```

### Expected result

| Role | Visible nav items |
|------|-------------------|
| SUPERADMIN | Dashboard, Bugs, Analytics, Org Chart, Users, Teams |
| TEAMLEAD | Dashboard, Bugs, Analytics, Org Chart |
| DEVELOPER | Dashboard, Bugs |
| TESTER | Dashboard, Bugs |

---

## Fix 2 — ONBOARDING.md: correct `/org` → `/org-chart`

**File:** `ONBOARDING.md`

### Root cause

The URLs Reference table (and any inline references) use `/org` but the actual
React Router route is `/org-chart`.

### Change

In the URLs Reference section replace:

```
| Org Chart | `/org` |
```

with:

```
| Org Chart | `/org-chart` |
```

Also update any other occurrences of `/org` that refer to the org chart page.

---

## Fix 3 — "Change status" button missing on bug detail

**Files:**
- `client/src/lib/lifecycle-client.ts`
- `client/src/pages/BugDetailPage.tsx`

### Root cause

`availableTransitions()` logic appears correct against the permission matrix.
The most likely runtime cause is that the `role` value received from the server
does not exactly match the string literals the function checks (e.g. `'ADMIN'`
vs `'SUPERADMIN'`), or stale auth state after a direct URL navigation causes
`me.data` to be `undefined` when `TransitionMenu` first mounts — making
`options.length === 0` and causing an early `return null`.

### Debug steps (do these first)

1. Open a bug detail page via **in-app navigation** (click a row in `/bugs`)
   rather than pasting a URL directly into the address bar.
2. Open the browser console and add a temporary log at the top of
   `availableTransitions()` to verify the exact `role` and `currentStatus`
   values being received.
3. Test the simplest case: log in as `ellen.test@bugfix.local` (TESTER), open
   a `FIXED` bug — the "Verify fix" and "Reject" options should appear.

### Fix if role string is mismatched

If the server is returning `'ADMIN'` instead of `'SUPERADMIN'` for the admin
user, update the Prisma seed **or** normalise the value in the auth middleware.
Check `server/prisma/seed.ts` and `server/src/middleware/require-auth.ts`.

### Fix if stale auth causes `me.data === undefined`

In `BugDetailPage.tsx` the early-return guard already covers this:

```tsx
if (bug.isLoading || !me.data) { return <Skeleton … />; }
```

If `me.data` briefly becomes `undefined` after rehydration, the `TransitionMenu`
is unmounted and remounted. Confirm React Query's `staleTime` is sufficient
(default 0 means an immediate background refetch on mount; setting
`staleTime: 60_000` in `query-client.ts` removes the flicker).

---

## Fix 4 — "New bug" button not shown for TEAMLEAD

**File:** `client/src/pages/BugListPage.tsx` (line ≈ 20)

### Root cause

`canCreate` checks only `TESTER` and `SUPERADMIN`. TEAMLEAD is omitted despite
the spec allowing TEAMLEAD to create bugs for their own team. The `RoleGuard`
on `/bugs/new` already includes `TEAMLEAD`, so only the button display is wrong.

### Change

```ts
// Before
const canCreate = me.data?.role === 'TESTER' || me.data?.role === 'SUPERADMIN';

// After
const canCreate = ['TESTER', 'TEAMLEAD', 'SUPERADMIN'].includes(me.data?.role ?? '');
```

---

## Fix 5 — DEVELOPER sees 0 bugs

**Files:**
- `server/src/modules/bugs/bugs.service.ts`
- `client/src/hooks/bugs/use-bug-filters.ts`

### Root cause

Two independent issues compound here.

**Part A — Database:** Developer users may have `teamId = null` in the seed
data. The server guard `if (!isSuperadmin && actorTeamId)` is skipped when
`actorTeamId` is null, so the query returns *all* bugs — but then the client
may apply a stale `Status: NEW` URL filter left over from a previous session,
yielding 0 results.

**Part B — Client:** The URL filter state (`?status=NEW` etc.) persists across
logout/login because `useBugFilters` reads from `window.location.search` and
never resets it when the active user changes.

### Fix Part A — verify and repair seed data

```bash
# Check Carol's teamId
psql -U bugfix bugfix_dev -c \
  "SELECT id, name, role, \"teamId\" FROM \"User\" WHERE email = 'carol.dev@bugfix.local';"
```

If `teamId` is null, update `server/prisma/seed.ts` to assign the correct team
ID and re-run:

```bash
npm --prefix server run seed
```

### Fix Part B — reset filters on user change

Add to `client/src/hooks/bugs/use-bug-filters.ts`:

```ts
import { useRef, useEffect } from 'react';
import { useMe } from '@/hooks/use-auth';

// inside useBugFilters(), after declaring `clear`:
const me = useMe();
const prevUserId = useRef(me.data?.id);
useEffect(() => {
  if (me.data?.id && me.data.id !== prevUserId.current) {
    clear();
    prevUserId.current = me.data.id;
  }
}, [me.data?.id]);
```

---

## Fix 6 — "Report a bug" link shown to DEVELOPER

**File:** `client/src/pages/DashboardPage.tsx`

### Root cause

The `EmptyState` in the Recent Bugs section renders a "Report a bug →" link
unconditionally. A DEVELOPER who has no assigned bugs lands here and sees a
link that leads to a 403.

### Change

```tsx
// Add after the existing useBugList hooks:
const canCreate = ['TESTER', 'TEAMLEAD', 'SUPERADMIN'].includes(me.data?.role ?? '');

// Replace the empty-state block:
recent.data?.data.length === 0 ? (
  <EmptyState
    title="No bugs yet"
    description={canCreate ? 'Be the first to report one.' : 'No bugs assigned yet.'}
    action={
      canCreate ? (
        <Link to="/bugs/new" className="text-accent underline">
          Report a bug →
        </Link>
      ) : undefined
    }
  />
)
```

> `useMe()` is already imported in `DashboardPage.tsx` — no new import needed.

---

## Execution order

Work top-to-bottom. Fixes 1–2 and 4–6 are safe, isolated, and low-risk.
Fix 3 and Fix 5 require verification before patching.

| Order | Fix | Effort | Blocks |
|-------|-----|--------|--------|
| 1 | Fix 2 — ONBOARDING URL | 2 min | — |
| 2 | Fix 1 — SideNav per-role links | 10 min | Teams/Users pages visible |
| 3 | Fix 4 — canCreate includes TEAMLEAD | 2 min | — |
| 4 | Fix 6 — Dashboard empty state role check | 5 min | — |
| 5 | Fix 5A — verify/repair seed teamId | 15 min | DEVELOPER bug list |
| 6 | Fix 5B — clear filters on user change | 10 min | DEVELOPER bug list |
| 7 | Fix 3 — investigate TransitionMenu | 30 min | Core bug lifecycle |

---

## Verification checklist

After all fixes, re-run the test session with each account:

- [ ] SUPERADMIN — sees Teams, Users, Org Chart, Analytics in sidebar
- [ ] SUPERADMIN — can navigate to `/teams`, `/users`, `/org-chart` without 404/403
- [ ] SUPERADMIN — "Change status" button visible on a NEW bug → Assign dialog opens
- [ ] TEAMLEAD — sees Analytics, Org Chart in sidebar; "New bug" button present on `/bugs`
- [ ] TESTER — can create a bug end-to-end (3-step wizard → submitted → NEW status)
- [ ] DEVELOPER — sees own team's bugs on `/bugs`; no "Report a bug" link on empty dashboard
- [ ] All roles — logout → login as different role → bug list filter resets
