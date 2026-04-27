# Bug Fix Web App — Design Spec

**Date:** 2026-04-27
**Status:** Approved (brainstorm phase)
**Audience:** Academic project (graded submission, viva demo)
**Authors:** Project owner + Claude (brainstorming session)

---

## 1. Overview

A web-based bug tracking platform where testers report bugs, admins assign them to developers, developers fix them, and testers verify fixes. Inspired by Jira / Bugzilla / GitHub Issues but scoped tight for an academic deliverable.

### 1.1 Goals
- Centralized bug tracking with role-based workflow
- Full lifecycle management (NEW → CLOSED) with enforced state machine
- Real-time-feeling UX via optimistic updates and react-query
- Production-grade UI quality (WCAG AA, polished motion, distinctive aesthetic)
- Deployable to free cloud tier for submission

### 1.2 Non-goals (deferred / future)
- Email notifications
- AI-based bug prediction
- GitHub integration
- Real-time chat / WebSockets
- Mobile native app
- Multi-tenancy / organizations

---

## 2. Architecture

### 2.1 High-level

```
┌─────────────────┐    HTTPS/JSON    ┌──────────────────┐    SQL    ┌──────────────┐
│  React Client   │ ───────────────► │  Express API     │ ────────► │  PostgreSQL  │
│  (Vite + TS)    │  ◄────JWT────    │  (Node + TS)     │  Prisma   │  (Neon)      │
│  Tailwind+shadcn│                  │                  │           │              │
└─────────────────┘                  └────────┬─────────┘           └──────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │  Cloudinary API  │
                                     │  (screenshots)   │
                                     └──────────────────┘
```

### 2.2 Repo structure (single repo, two folders)

```
bug-fix-app/
├── client/             Vite + React + TS
│   ├── src/
│   ├── .env            VITE_API_URL=http://localhost:4000
│   └── package.json
├── server/             Node + Express + TS
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tests/
│   ├── .env            DATABASE_URL, JWT_SECRET, CLOUDINARY_*
│   └── package.json
├── docs/
│   └── superpowers/specs/
├── .github/workflows/ci.yml
├── docker-compose.yml  postgres for local dev
├── README.md
└── .gitignore
```

### 2.3 Stack

| Layer | Choice |
|---|---|
| Client framework | React 18 + Vite + TypeScript |
| Client styling | Tailwind CSS + shadcn/ui |
| Client state | zustand (auth) + @tanstack/react-query (server state) |
| Client forms | react-hook-form + zod |
| Client motion | framer-motion |
| Client charts | recharts |
| Client icons | lucide-react |
| Server framework | Node + Express + TypeScript |
| Server validation | zod |
| Server auth | jsonwebtoken + bcrypt |
| Server uploads | multer (memory) → cloudinary signed upload |
| ORM | Prisma |
| Database | PostgreSQL (Neon free tier prod, docker compose local) |
| File storage | Cloudinary (free tier) |
| Testing — server | Jest + Supertest |
| Testing — client | Vitest + React Testing Library + MSW + jest-axe |
| Deploy — client | Vercel |
| Deploy — server | Render |
| Deploy — DB | Neon |

---

## 3. Data model (Prisma schema)

```prisma
enum Role        { ADMIN  DEVELOPER  TESTER }
enum Severity    { LOW  MEDIUM  HIGH  CRITICAL }
enum Priority    { P1  P2  P3  P4 }
enum BugStatus   { NEW  ASSIGNED  IN_PROGRESS  FIXED  VERIFIED  CLOSED }

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  passwordHash String
  role         Role      @default(TESTER)
  reportedBugs Bug[]     @relation("Reporter")
  assignedBugs Bug[]     @relation("Assignee")
  comments     Comment[]
  createdAt    DateTime  @default(now())
}

model Bug {
  id               String     @id @default(cuid())
  title            String
  description      String
  stepsToReproduce String
  severity         Severity
  priority         Priority?           // admin sets after assignment
  status           BugStatus  @default(NEW)
  screenshots      String[]            // Cloudinary URLs
  reporterId       String
  assigneeId       String?
  reporter         User       @relation("Reporter", fields: [reporterId], references: [id])
  assignee         User?      @relation("Assignee", fields: [assigneeId], references: [id])
  comments         Comment[]
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  closedAt         DateTime?           // for avg-fix-time analytics

  @@index([status])
  @@index([assigneeId])
  @@index([severity, priority])
}

model Comment {
  id        String   @id @default(cuid())
  bugId     String
  authorId  String
  text      String
  bug       Bug      @relation(fields: [bugId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Notes:**
- `Priority` nullable — reporter sets `severity`, admin sets `priority` on assignment
- `screenshots` is a Postgres `String[]` column; no separate Attachments table
- Cascade delete: comments removed when bug deleted

---

## 4. Bug lifecycle / state machine

```
   ┌─────┐  admin    ┌──────────┐  dev   ┌─────────────┐  dev   ┌───────┐
   │ NEW │ ────────► │ ASSIGNED │ ─────► │ IN_PROGRESS │ ─────► │ FIXED │
   └─────┘  assigns  └──────────┘  start └─────────────┘  fix   └───┬───┘
                                            ▲                       │
                                            │ tester rejects        │ tester verifies
                                            └───────────────────────┤
                                                                    ▼
                                           admin closes        ┌──────────┐
                                          ◄───────────────────│ VERIFIED │
                                          ┌────────┐          └──────────┘
                                          │ CLOSED │
                                          └────────┘
```

### 4.1 Allowed transitions (server-enforced)

| From → To | Who | Side effects |
|---|---|---|
| _create_ → NEW | TESTER, ADMIN | sets `reporterId` |
| NEW → ASSIGNED | ADMIN | requires `assigneeId` + `priority` in body |
| ASSIGNED → IN_PROGRESS | DEVELOPER (assignee only) | — |
| IN_PROGRESS → FIXED | DEVELOPER (assignee only) | — |
| FIXED → VERIFIED | TESTER, ADMIN | — |
| FIXED → IN_PROGRESS | TESTER, ADMIN (reject) | — |
| VERIFIED → CLOSED | ADMIN | sets `closedAt = now()` |

All other transitions return `400 Invalid transition`. Comments allowed in any state by anyone. Bug edit (title/description/steps) only by reporter or admin, only while status = `NEW`.

---

## 5. REST API surface

### 5.1 Auth (public)
```
POST   /api/auth/register          { name, email, password, role? }   → { user, token }
POST   /api/auth/login             { email, password }                → { user, token }
POST   /api/auth/logout                                               → 204
GET    /api/auth/me                                                   → { user }
```

### 5.2 Users
```
GET    /api/users                  ?role=DEVELOPER                    → User[]   (admin)
GET    /api/users/:id                                                 → User
PATCH  /api/users/:id/role         { role }                           (admin)
```

### 5.3 Bugs
```
GET    /api/bugs                   ?status=&severity=&priority=&assigneeId=&q=&page=&limit=
POST   /api/bugs                   multipart: fields + screenshots[]  (tester/admin)
GET    /api/bugs/:id                                                  → Bug + comments
PATCH  /api/bugs/:id               { title?, description?, steps? }   (reporter, NEW only)
DELETE /api/bugs/:id                                                  (admin only)
POST   /api/bugs/:id/transition    { to, assigneeId?, priority? }
POST   /api/bugs/:id/screenshots   multipart: files[]                 (reporter)
```

### 5.4 Comments
```
GET    /api/bugs/:id/comments                                         → Comment[]
POST   /api/bugs/:id/comments      { text }                           → Comment
PATCH  /api/comments/:id           { text }                           (author only)
DELETE /api/comments/:id                                              (author or admin)
```

### 5.5 Analytics (admin)
```
GET    /api/stats/summary          → { total, byStatus, bySeverity, byPriority }
GET    /api/stats/developers       → [{ user, assigned, fixed, avgFixHours }]
```

### 5.6 Conventions
- All non-auth routes require auth (httpOnly cookie + bearer fallback)
- Errors: `{ error: { code, message, details? } }` with proper 4xx/5xx
- Pagination: `?page=1&limit=20`, response `{ data, total, page, limit }`
- All bodies/queries validated by zod schemas

---

## 6. Frontend design

### 6.1 Aesthetic direction — "Field Report"
Bug tracker as lab notebook. Specimens (bugs), evidence chains (lifecycle), status chips (state). Dark-first, mono headings, subtle dot-grid background, single amber accent, hairline borders. Distinct from generic SaaS aesthetics.

### 6.2 Design tokens

**Type:**
```
display/headings  →  JetBrains Mono (variable weight)
body              →  Geist Sans (variable)
data/IDs/code     →  JetBrains Mono, tabular nums
scale             →  12 / 14 / 16 / 18 / 24 / 32 / 48
body              →  16px, line-height 1.6, 65–75ch measure
```

**Color (Tailwind tokens, all pairs ≥4.5:1):**
```
bg-base       zinc-950        text-primary    zinc-100
bg-surface    zinc-900        text-secondary  zinc-400
bg-elevated   zinc-800        text-tertiary   zinc-500
border        zinc-800/zinc-700
accent        amber-400  (#FBBF24)   primary CTA, focus ring

severity:  LOW emerald-400 · MED sky-400 · HIGH amber-400 · CRITICAL rose-400
status:    NEW slate · ASSIGNED indigo · IN_PROGRESS amber · FIXED emerald · VERIFIED teal · CLOSED zinc
```
Severity/status pair **icon + text label** (color-not-only rule).

**Atmosphere:**
- 8px dot-grid background, 4% opacity
- Hairline 1px borders, no decorative shadows except modals/popovers
- Subtle film-grain noise on hero/empty states

**Spacing:** 4/8 system → `1 2 3 4 6 8 12 16 24` (Tailwind scale).

### 6.3 Page inventory

| # | Route | Purpose | Roles |
|---|---|---|---|
| 1 | `/login`, `/register` | auth | public |
| 2 | `/dashboard` | KPI cards + recent activity | all |
| 3 | `/bugs` | filterable list (virtualized) | all |
| 4 | `/bugs/new` | 3-step create (details → repro → attach) | tester, admin |
| 5 | `/bugs/:id` | detail: meta panel + activity stream + comments | all |
| 6 | `/bugs/:id/edit` | edit (NEW status only) | reporter, admin |
| 7 | `/analytics` | summary + per-developer charts | admin |
| 8 | `/users` | user list, role mgmt | admin |
| 9 | `/profile` | own user settings | all |
| 10 | `/404`, `/403` | error states | — |

### 6.4 Layout system
- **Desktop (≥1024px):** Sidebar 240px (collapses 64px) + topbar 56px + main `max-w-[1280px]`
- **Tablet (768–1024):** auto-collapsed sidebar, drawer for nav labels
- **Mobile (<768):** bottom nav 4 items (`Dashboard / Bugs / + / Profile`) + filter bottom-sheet

### 6.5 Component inventory

```
shell:        AppShell · TopBar · SideNav · BottomNav (mobile) · CommandPalette (⌘K)
auth:         AuthGuard · RoleGuard · LoginForm · RegisterForm
bug:          BugRow · BugCard · BugDetail · BugEditor · BugWizard
              StatusBadge · SeverityChip · PriorityChip · TransitionMenu
              AssigneeSelector · ScreenshotGallery · ScreenshotDrop · Lightbox
filters:      FilterBar · SearchInput · ActiveFilterChips · Pagination · SortMenu
comments:     CommentThread · CommentItem · CommentEditor (markdown-lite)
analytics:    KpiCard · BarCard · DonutCard · DeveloperLeaderboard
common:       Button · Input · Textarea · Select · Combobox · Dialog · Sheet
              Toast · Tooltip · Skeleton · EmptyState · ErrorBoundary
```

### 6.6 Motion (150–300ms, transform/opacity only)
- Route transition: 200ms fade + 8px Y-translate (ease-out enter, ease-in exit ~140ms)
- Bug list reveal: stagger 30ms per row
- Status change: spring scale 1 → 1.08 → 1 on the badge (optimistic)
- Toast: slide-in 240ms, dismiss 160ms, auto 4s, `aria-live="polite"`
- Modal: scale 0.96 → 1 + scrim fade 160ms
- All wrapped in `prefers-reduced-motion: reduce` → instant

### 6.7 UX rules baked in
- **A11y:** WCAG AA, focus-visible 2px amber ring (never removed), heading hierarchy h1→h6, skip-link, alt text on screenshots, severity uses icon + text (not color alone)
- **Touch:** all interactive ≥44×44px, ≥8px spacing
- **Forms:** visible labels (no placeholder-only), zod validation on blur, error below field with `role="alert"`, focus first invalid on submit, autocomplete + correct input types, password show-toggle
- **Feedback:** skeletons on lists/detail, optimistic transitions with rollback toast, undo on bug delete (5s)
- **Performance:** route-level code-split, virtualize bug list at 50+ rows (`@tanstack/react-virtual`), lazy-load Lightbox + chart libs, image `loading="lazy"`, reserve aspect-ratio
- **Navigation:** bottom nav ≤5 items, deep-linkable filters (`/bugs?status=NEW&severity=HIGH`), preserve scroll on back, breadcrumbs on detail pages
- **Empty states:** every list has illustration + action ("No bugs match. Clear filters →")
- **Keyboard:** `⌘K` palette, `c` new bug, `j/k` navigate list, `Esc` close modal
- **Dark/light:** both themes tokenized, contrast verified per theme

---

## 7. Auth, roles, and security

### 7.1 Auth flow (JWT)
```
register/login → server hashes (bcrypt cost 12) → issues JWT (HS256, 7d expiry)
client receives JWT in httpOnly Secure SameSite=Lax cookie
every API request → middleware verifies → req.user = { id, role }
```

- **Registration default role:** `TESTER`. `DEVELOPER` and `ADMIN` granted only by existing admin via `PATCH /api/users/:id/role`. First admin seeded via `npm run seed`.
- **Token storage:** httpOnly cookie (XSS-resistant). Client mirrors decoded user in zustand purely for UI gating.
- **Refresh strategy:** single 7-day token, re-login on expiry. No refresh-token complexity.
- **Logout:** server clears cookie, client clears store.

### 7.2 Authorization layers

```
Layer 1  AuthGuard (route)        — redirects to /login if no session
Layer 2  RoleGuard (route)        — 403 page if role mismatch
Layer 3  Server middleware:
           requireAuth            — verifies JWT
           requireRole(...roles)  — role allowlist per endpoint
           requireBugAccess       — bug-level check (reporter/assignee/admin)
Layer 4  Transition state machine — enforces who can move which state (Section 4)
```

UI gating is cosmetic; **server is authoritative**.

### 7.3 Security checklist (OWASP top 10 mapping)

| Risk | Mitigation |
|---|---|
| Injection | Prisma parameterizes; no raw SQL; zod validates all inputs |
| Broken auth | bcrypt cost 12, JWT HS256 with 32-byte secret in `.env`, httpOnly cookies, rate-limit `/auth/login` (5/min/IP via `express-rate-limit`) |
| Broken access control | server-side role middleware on every non-public route + bug-level ownership check |
| XSS | React auto-escapes by default; comments rendered as plain text or sanitized markdown via DOMPurify; never bypass React's escape behavior on user-supplied content |
| CSRF | SameSite=Lax cookie + custom `X-Requested-With` header check; CORS allowlist (only client origin) |
| Sensitive data | passwords never returned (Prisma `select` excludes `passwordHash`); JWT secret in env, not committed |
| Misconfiguration | `helmet` middleware (CSP, HSTS, frame-deny, no-sniff); `.env.example` checked in, `.env` gitignored |
| Vulnerable components | `npm audit` in CI; pin major versions |
| Insufficient logging | morgan request log + error log to file in prod; emails redacted |
| File upload / SSRF | screenshots → Cloudinary signed-upload only; whitelist mime `image/png\|jpeg\|webp`, max 5MB, max 5 files |
| IDOR | every `:id` route loads resource then checks ownership before returning |

### 7.4 Password policy
- Min 8 chars, must include letter + number (zod regex)
- bcrypt cost 12

### 7.5 Sample input schema
```ts
const createBugSchema = z.object({
  title:            z.string().min(3).max(140),
  description:      z.string().min(10).max(5000),
  stepsToReproduce: z.string().min(5).max(2000),
  severity:         z.enum(['LOW','MEDIUM','HIGH','CRITICAL']),
  screenshots:      z.array(z.string().url()).max(5).optional(),
});
```

---

## 8. Testing strategy

### 8.1 Backend (Jest + Supertest + test Postgres)
```
unit/           Pure functions (transition validator, severity utils, zod schemas)
integration/    API routes hit a real test DB
                ├ auth.test.ts        register/login/me, role guards, rate-limit
                ├ bugs.test.ts        CRUD + filters + pagination + screenshot upload mock
                ├ transitions.test.ts every legal/illegal transition × every role
                ├ comments.test.ts   create/edit/delete + author guard
                └ stats.test.ts      summary + per-developer (with seeded fixtures)
```
- Test DB reset per file via `prisma migrate reset --skip-seed`
- Cloudinary SDK mocked
- Coverage target: 70%+ on routes, 90%+ on transition state machine

### 8.2 Frontend (Vitest + RTL + MSW)
```
components/     BugRow, StatusBadge, FilterBar, CommentItem (interaction + a11y)
pages/          login flow, bug create wizard, bug detail (state transitions)
hooks/          useAuth, useBugs (react-query) — MSW intercepts network
guards/         AuthGuard / RoleGuard (mocked router)
a11y/           jest-axe smoke test on every page snapshot
```
- MSW replaces axios in tests
- Optional: one Playwright e2e (login → create → assign → fix → verify → close)

### 8.3 CI (GitHub Actions)
```
on PR: lint → typecheck → server tests (with postgres service) → client tests → build
```

---

## 9. Deployment

| Layer | Service | Cost | Notes |
|---|---|---|---|
| Client | Vercel | free | auto-deploy on push to `main`, env: `VITE_API_URL` |
| Server | Render Web Service | free (cold start ~30s) | env: `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `CLIENT_ORIGIN`; build `npm run build && prisma migrate deploy`; start `node dist/index.js` |
| DB | Neon Postgres | free 0.5GB | pooled connection string |
| Files | Cloudinary | free 25GB | signed-upload preset; client uploads direct |

`.env.example` checked in for both packages. README includes deploy steps.

### 9.1 Local commands
```bash
docker compose up -d                                    # postgres :5432
cd server && npm i
npx prisma migrate dev && npm run seed && npm run dev   # :4000
cd ../client && npm i && npm run dev                    # :5173
```

### 9.2 Demo prep (academic viva)
- `prisma/seed.ts` creates: 1 admin / 2 devs / 2 testers / 12 sample bugs across all states
- README screenshots embedded
- Mermaid lifecycle diagram in README
- Architecture diagram (PNG) for printout

---

## 10. Acceptance criteria (definition of done)

- [ ] All 7 lifecycle transitions enforced + tested
- [ ] All 3 roles work end-to-end with correct gates
- [ ] Bug list filters + pagination + virtualization
- [ ] Screenshot upload to Cloudinary works locally and in deployed app
- [ ] Comments edit/delete by author only
- [ ] Analytics page renders both summary + per-developer charts
- [ ] CI green on PR (lint, typecheck, server + client tests, build)
- [ ] WCAG AA verified with axe on key pages
- [ ] Deployed URLs documented in README
- [ ] README includes setup, architecture diagram, lifecycle diagram, screenshots

---

## 11. Open questions / future enhancements

Tracked separately, not in scope for v1:
- Email notifications on assignment / status change
- Activity feed / audit log table (per-bug history)
- @mentions in comments
- Saved filter views
- Bulk actions on bug list
- CSV export of analytics
- GitHub integration (link PR / commit to bug)
- Real-time updates via WebSockets
- Dark/light theme toggle persisted per-user
