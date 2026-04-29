# Plan 2 — Bugs Core (server) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the bug-tracking core on the server: Bug + Comment-relation-ready data model, full bug CRUD with role-aware filtering, screenshot upload to Cloudinary via signed signatures, and an enforced state machine for the lifecycle (NEW → CLOSED). End state: every transition path tested, every IDOR/role rule covered.

**Architecture:** Adds a `bugs` module (routes/service/schema) and a `lifecycle/transition.ts` pure-function state machine with its own unit tests. Cloudinary signature is generated server-side; the client uploads the image directly to Cloudinary and posts the resulting URL back. Comment model is added in this plan so the relation is correct, but comment endpoints land in Plan 3.

**Tech Stack:** Same as Plan 1, plus `cloudinary` SDK and `multer` (used only for the size/mime gate before signing — actual storage is Cloudinary).

**Prereqs:** Plan 1 complete (auth, users, middleware, CI all working).

---

## File Structure

```
server/
├── prisma/schema.prisma                  + Bug, Comment, Severity, Priority, BugStatus
├── src/
│   ├── lib/
│   │   └── cloudinary.ts                 sign() + verify() helpers
│   └── modules/bugs/
│       ├── bugs.routes.ts
│       ├── bugs.service.ts
│       ├── bugs.schema.ts
│       └── lifecycle.ts                  pure state-machine
└── tests/
    ├── helpers/factories.ts              + createBug()
    ├── lifecycle.test.ts                 unit tests for state machine
    ├── bugs.test.ts                      integration
    └── screenshots.test.ts               cloudinary mocked
```

---

## Task 1: Extend schema — Bug, Comment, enums, indexes

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add to `schema.prisma`** (append; preserve existing User and `Role`)

```prisma
enum Severity  { LOW MEDIUM HIGH CRITICAL }
enum Priority  { P1 P2 P3 P4 }
enum BugStatus { NEW ASSIGNED IN_PROGRESS FIXED VERIFIED CLOSED }

model Bug {
  id               String     @id @default(cuid())
  title            String
  description      String
  stepsToReproduce String
  severity         Severity
  priority         Priority?
  status           BugStatus  @default(NEW)
  screenshots      String[]
  reporterId       String
  assigneeId       String?
  reporter         User       @relation("Reporter", fields: [reporterId], references: [id])
  assignee         User?      @relation("Assignee", fields: [assigneeId], references: [id])
  comments         Comment[]
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  closedAt         DateTime?

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

Add backward relations on `User`:
```prisma
model User {
  // ...existing fields...
  reportedBugs Bug[]     @relation("Reporter")
  assignedBugs Bug[]     @relation("Assignee")
  comments     Comment[]
}
```

- [ ] **Step 2: Create migration**

Run: `cd server && npx prisma migrate dev --name bugs_and_comments`
Expected: a new migration folder + Prisma client regenerated.

- [ ] **Step 3: Commit**

```bash
git add server/prisma
git commit -m "feat(server): add Bug, Comment, enums, indexes"
```

---

## Task 2: Lifecycle pure state machine (TDD)

**Files:**
- Create: `server/src/modules/bugs/lifecycle.ts`
- Create: `server/tests/lifecycle.test.ts`

- [ ] **Step 1: Write failing tests `tests/lifecycle.test.ts`**

```ts
import { canTransition, type LifecycleContext } from '../src/modules/bugs/lifecycle';

const baseCtx: LifecycleContext = {
  fromStatus: 'NEW',
  toStatus: 'ASSIGNED',
  actorRole: 'ADMIN',
  actorId: 'u_admin',
  bugAssigneeId: null,
  body: { assigneeId: 'u_dev', priority: 'P2' },
};

describe('canTransition', () => {
  it('admin can NEW → ASSIGNED with assignee + priority', () => {
    expect(canTransition(baseCtx).ok).toBe(true);
  });

  it('admin NEW → ASSIGNED without assigneeId fails', () => {
    expect(canTransition({ ...baseCtx, body: { priority: 'P2' } }).ok).toBe(false);
  });

  it('developer can ASSIGNED → IN_PROGRESS only if assignee', () => {
    expect(
      canTransition({
        ...baseCtx,
        fromStatus: 'ASSIGNED',
        toStatus: 'IN_PROGRESS',
        actorRole: 'DEVELOPER',
        actorId: 'u_dev',
        bugAssigneeId: 'u_dev',
        body: {},
      }).ok,
    ).toBe(true);
  });

  it('developer NOT assignee cannot start work', () => {
    expect(
      canTransition({
        ...baseCtx,
        fromStatus: 'ASSIGNED',
        toStatus: 'IN_PROGRESS',
        actorRole: 'DEVELOPER',
        actorId: 'u_dev2',
        bugAssigneeId: 'u_dev',
        body: {},
      }).ok,
    ).toBe(false);
  });

  it.each([
    ['IN_PROGRESS', 'FIXED', 'DEVELOPER', true],
    ['FIXED', 'VERIFIED', 'TESTER', true],
    ['FIXED', 'IN_PROGRESS', 'TESTER', true],
    ['VERIFIED', 'CLOSED', 'ADMIN', true],
    ['NEW', 'IN_PROGRESS', 'DEVELOPER', false],
    ['CLOSED', 'IN_PROGRESS', 'ADMIN', false],
    ['ASSIGNED', 'CLOSED', 'ADMIN', false],
  ] as const)('%s → %s by %s : %s', (from, to, role, ok) => {
    expect(
      canTransition({
        fromStatus: from,
        toStatus: to,
        actorRole: role,
        actorId: 'u_dev',
        bugAssigneeId: 'u_dev',
        body: { assigneeId: 'u_dev', priority: 'P2' },
      }).ok,
    ).toBe(ok);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (`lifecycle` not found)

Run: `npm test -- lifecycle.test.ts`

- [ ] **Step 3: Write `server/src/modules/bugs/lifecycle.ts`**

```ts
import type { Role, BugStatus, Priority } from '@prisma/client';

export interface LifecycleContext {
  fromStatus: BugStatus;
  toStatus: BugStatus;
  actorRole: Role;
  actorId: string;
  bugAssigneeId: string | null;
  body: { assigneeId?: string; priority?: Priority };
}

export type Result =
  | { ok: true }
  | { ok: false; reason: string };

const allow = (ctx: LifecycleContext): Result => {
  const { fromStatus, toStatus, actorRole, actorId, bugAssigneeId, body } = ctx;

  // NEW → ASSIGNED  (admin only, must include assigneeId + priority)
  if (fromStatus === 'NEW' && toStatus === 'ASSIGNED') {
    if (actorRole !== 'ADMIN') return { ok: false, reason: 'Only admin can assign' };
    if (!body.assigneeId) return { ok: false, reason: 'assigneeId required' };
    if (!body.priority) return { ok: false, reason: 'priority required' };
    return { ok: true };
  }

  // ASSIGNED → IN_PROGRESS  (assignee dev only)
  if (fromStatus === 'ASSIGNED' && toStatus === 'IN_PROGRESS') {
    if (actorRole !== 'DEVELOPER') return { ok: false, reason: 'Only developer can start' };
    if (bugAssigneeId !== actorId) return { ok: false, reason: 'Only assignee can start' };
    return { ok: true };
  }

  // IN_PROGRESS → FIXED  (assignee dev only)
  if (fromStatus === 'IN_PROGRESS' && toStatus === 'FIXED') {
    if (actorRole !== 'DEVELOPER') return { ok: false, reason: 'Only developer can mark fixed' };
    if (bugAssigneeId !== actorId) return { ok: false, reason: 'Only assignee can mark fixed' };
    return { ok: true };
  }

  // FIXED → VERIFIED  (tester or admin)
  if (fromStatus === 'FIXED' && toStatus === 'VERIFIED') {
    if (actorRole === 'TESTER' || actorRole === 'ADMIN') return { ok: true };
    return { ok: false, reason: 'Only tester/admin can verify' };
  }

  // FIXED → IN_PROGRESS (reject)
  if (fromStatus === 'FIXED' && toStatus === 'IN_PROGRESS') {
    if (actorRole === 'TESTER' || actorRole === 'ADMIN') return { ok: true };
    return { ok: false, reason: 'Only tester/admin can reject' };
  }

  // VERIFIED → CLOSED  (admin only)
  if (fromStatus === 'VERIFIED' && toStatus === 'CLOSED') {
    if (actorRole !== 'ADMIN') return { ok: false, reason: 'Only admin can close' };
    return { ok: true };
  }

  return { ok: false, reason: `Invalid transition ${fromStatus} → ${toStatus}` };
};

export const canTransition = allow;
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm test -- lifecycle.test.ts`

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/bugs/lifecycle.ts server/tests/lifecycle.test.ts
git commit -m "feat(server): pure-function bug lifecycle state machine"
```

---

## Task 3: Bug zod schemas + factory helpers

**Files:**
- Create: `server/src/modules/bugs/bugs.schema.ts`
- Modify: `server/tests/helpers/factories.ts`

- [ ] **Step 1: Write `server/src/modules/bugs/bugs.schema.ts`**

```ts
import { z } from 'zod';

export const SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const PRIORITY = ['P1', 'P2', 'P3', 'P4'] as const;
export const STATUS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'] as const;

export const createBugSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  stepsToReproduce: z.string().min(5).max(2000),
  severity: z.enum(SEVERITY),
  screenshots: z.array(z.string().url()).max(5).optional(),
});

export const updateBugSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  description: z.string().min(10).max(5000).optional(),
  stepsToReproduce: z.string().min(5).max(2000).optional(),
});

export const transitionSchema = z.object({
  to: z.enum(STATUS),
  assigneeId: z.string().cuid().optional(),
  priority: z.enum(PRIORITY).optional(),
});

export const listBugsQuery = z.object({
  status: z.enum(STATUS).optional(),
  severity: z.enum(SEVERITY).optional(),
  priority: z.enum(PRIORITY).optional(),
  assigneeId: z.string().cuid().optional(),
  q: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateBugInput = z.infer<typeof createBugSchema>;
export type UpdateBugInput = z.infer<typeof updateBugSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;
export type ListBugsQuery = z.infer<typeof listBugsQuery>;
```

- [ ] **Step 2: Add `createBug` + `resetDb` extensions to `tests/helpers/factories.ts`**

Replace `resetDb` and append `createBug`:
```ts
export async function resetDb() {
  await prisma.comment.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.user.deleteMany();
}

export async function createBug(opts: {
  reporterId: string;
  assigneeId?: string;
  status?: import('@prisma/client').BugStatus;
  severity?: import('@prisma/client').Severity;
  priority?: import('@prisma/client').Priority;
  title?: string;
}) {
  return prisma.bug.create({
    data: {
      title: opts.title ?? 'Sample bug',
      description: 'Something is broken',
      stepsToReproduce: '1. Do X 2. See Y',
      severity: opts.severity ?? 'MEDIUM',
      priority: opts.priority ?? null,
      status: opts.status ?? 'NEW',
      reporterId: opts.reporterId,
      assigneeId: opts.assigneeId ?? null,
      screenshots: [],
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/bugs/bugs.schema.ts server/tests/helpers/factories.ts
git commit -m "feat(server): bug zod schemas + factory helpers"
```

---

## Task 4: `GET /api/bugs` list with filters + pagination (TDD)

**Files:**
- Create: `server/src/modules/bugs/bugs.service.ts`
- Create: `server/src/modules/bugs/bugs.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/bugs.test.ts`

- [ ] **Step 1: Write failing test `tests/bugs.test.ts`**

```ts
import { resetDb, createUser, createBug } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';
import type { Role } from '@prisma/client';

beforeEach(resetDb);

async function authedAs(role: Role) {
  const { user } = await createUser({ role });
  return { user, cookie: `token=${signJwt({ sub: user.id, role: user.role })}` };
}

describe('GET /api/bugs', () => {
  it('returns paginated bugs filterable by status/severity', async () => {
    const { user: reporter, cookie } = await authedAs('ADMIN');
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'HIGH' });
    await createBug({ reporterId: reporter.id, status: 'CLOSED', severity: 'LOW' });
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'CRITICAL' });

    const res = await api()
      .get('/api/bugs?status=NEW&page=1&limit=10')
      .set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    res.body.data.forEach((b: { status: string }) => expect(b.status).toBe('NEW'));
  });

  it('text search hits title and description', async () => {
    const { user: reporter, cookie } = await authedAs('ADMIN');
    await createBug({ reporterId: reporter.id, title: 'Login button broken' });
    await createBug({ reporterId: reporter.id, title: 'Sign up page' });
    const res = await api().get('/api/bugs?q=login').set('Cookie', [cookie]);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].title).toMatch(/login/i);
  });

  it('rejects unauthenticated', async () => {
    const res = await api().get('/api/bugs');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Write `server/src/modules/bugs/bugs.service.ts`** (initial — list only; later tasks extend)

```ts
import { prisma } from '../../db';
import type { ListBugsQuery } from './bugs.schema';

export async function listBugs(q: ListBugsQuery) {
  const where = {
    ...(q.status && { status: q.status }),
    ...(q.severity && { severity: q.severity }),
    ...(q.priority && { priority: q.priority }),
    ...(q.assigneeId && { assigneeId: q.assigneeId }),
    ...(q.q && {
      OR: [
        { title: { contains: q.q, mode: 'insensitive' as const } },
        { description: { contains: q.q, mode: 'insensitive' as const } },
      ],
    }),
  };
  const [total, data] = await Promise.all([
    prisma.bug.count({ where }),
    prisma.bug.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        reporter: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);
  return { data, total, page: q.page, limit: q.limit };
}
```

- [ ] **Step 4: Write `server/src/modules/bugs/bugs.routes.ts`** (list only for now)

```ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { listBugsQuery } from './bugs.schema';
import * as svc from './bugs.service';

export const bugsRouter = Router();
bugsRouter.use(requireAuth);

bugsRouter.get('/', async (req, res, next) => {
  try {
    const q = listBugsQuery.parse(req.query);
    res.json(await svc.listBugs(q));
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Mount in `app.ts`**

```ts
import { bugsRouter } from './modules/bugs/bugs.routes';
// ...
app.use('/api/bugs', bugsRouter);
```

- [ ] **Step 6: Run, expect PASS**

Run: `npm test -- bugs.test.ts`

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/bugs server/src/app.ts server/tests/bugs.test.ts
git commit -m "feat(server): GET /api/bugs list + filter + pagination"
```

---

## Task 5: `POST /api/bugs` create (TDD)

**Files:**
- Modify: `server/src/modules/bugs/bugs.service.ts`
- Modify: `server/src/modules/bugs/bugs.routes.ts`
- Modify: `server/tests/bugs.test.ts`

- [ ] **Step 1: Append failing test**

```ts
describe('POST /api/bugs', () => {
  const valid = {
    title: 'Login fails',
    description: 'Clicking login does nothing on Chrome 121',
    stepsToReproduce: '1. Open /login 2. Click button 3. Nothing happens',
    severity: 'HIGH',
  };

  it('tester can create a bug — defaults to NEW status', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const res = await api().post('/api/bugs').set('Cookie', [cookie]).send(valid);
    expect(res.status).toBe(201);
    expect(res.body.bug).toMatchObject({
      title: valid.title,
      status: 'NEW',
      severity: 'HIGH',
      reporterId: user.id,
      priority: null,
    });
  });

  it('developer cannot create bugs', async () => {
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api().post('/api/bugs').set('Cookie', [cookie]).send(valid);
    expect(res.status).toBe(403);
  });

  it('validation errors on missing fields', async () => {
    const { cookie } = await authedAs('TESTER');
    const res = await api()
      .post('/api/bugs')
      .set('Cookie', [cookie])
      .send({ title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Add `createBug` to service**

In `bugs.service.ts`:
```ts
import type { CreateBugInput } from './bugs.schema';

export async function createBug(reporterId: string, input: CreateBugInput) {
  return prisma.bug.create({
    data: {
      ...input,
      screenshots: input.screenshots ?? [],
      reporterId,
    },
  });
}
```

- [ ] **Step 4: Add route in `bugs.routes.ts`**

```ts
import { requireRole } from '../../middleware/require-role';
import { createBugSchema } from './bugs.schema';

bugsRouter.post('/', requireRole('TESTER', 'ADMIN'), async (req, res, next) => {
  try {
    const input = createBugSchema.parse(req.body);
    const bug = await svc.createBug(req.user!.id, input);
    res.status(201).json({ bug });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Run, expect PASS**

Run: `npm test -- bugs.test.ts`

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/bugs server/tests/bugs.test.ts
git commit -m "feat(server): POST /api/bugs (tester/admin)"
```

---

## Task 6: `GET /api/bugs/:id` detail (TDD)

**Files:**
- Modify: `server/src/modules/bugs/bugs.service.ts`
- Modify: `server/src/modules/bugs/bugs.routes.ts`
- Modify: `server/tests/bugs.test.ts`

- [ ] **Step 1: Append failing test**

```ts
describe('GET /api/bugs/:id', () => {
  it('returns the bug with reporter/assignee + comments[]', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id });
    const res = await api().get(`/api/bugs/${bug.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.bug.id).toBe(bug.id);
    expect(res.body.bug.reporter.id).toBe(user.id);
    expect(Array.isArray(res.body.bug.comments)).toBe(true);
  });

  it('404 when missing', async () => {
    const { cookie } = await authedAs('TESTER');
    const res = await api().get('/api/bugs/nope').set('Cookie', [cookie]);
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Add to service**

```ts
import { AppError } from '../../lib/http-error';

export async function getBug(id: string) {
  const bug = await prisma.bug.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, email: true, role: true } },
      assignee: { select: { id: true, name: true, email: true, role: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });
  if (!bug) throw AppError.notFound('Bug not found');
  return bug;
}
```

- [ ] **Step 4: Add route**

```ts
bugsRouter.get('/:id', async (req, res, next) => {
  try {
    const bug = await svc.getBug(req.params.id);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Run, expect PASS**

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/bugs server/tests/bugs.test.ts
git commit -m "feat(server): GET /api/bugs/:id with relations"
```

---

## Task 7: `PATCH /api/bugs/:id` edit (reporter, NEW only) + `DELETE` (admin) (TDD)

**Files:**
- Modify: `server/src/modules/bugs/bugs.service.ts`
- Modify: `server/src/modules/bugs/bugs.routes.ts`
- Modify: `server/tests/bugs.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
describe('PATCH /api/bugs/:id', () => {
  it('reporter can edit while status=NEW', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id, status: 'NEW' });
    const res = await api()
      .patch(`/api/bugs/${bug.id}`)
      .set('Cookie', [cookie])
      .send({ title: 'Updated title' });
    expect(res.status).toBe(200);
    expect(res.body.bug.title).toBe('Updated title');
  });

  it('non-reporter is forbidden', async () => {
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const { cookie } = await authedAs('TESTER');
    const res = await api()
      .patch(`/api/bugs/${bug.id}`)
      .set('Cookie', [cookie])
      .send({ title: 'Hack' });
    expect(res.status).toBe(403);
  });

  it('reporter cannot edit once status leaves NEW', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id, status: 'ASSIGNED' });
    const res = await api()
      .patch(`/api/bugs/${bug.id}`)
      .set('Cookie', [cookie])
      .send({ title: 'Late edit' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/bugs/:id', () => {
  it('admin can delete', async () => {
    const { cookie } = await authedAs('ADMIN');
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const res = await api().delete(`/api/bugs/${bug.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(204);
  });

  it('non-admin cannot delete', async () => {
    const { user, cookie } = await authedAs('TESTER');
    const bug = await createBug({ reporterId: user.id });
    const res = await api().delete(`/api/bugs/${bug.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Add to service**

```ts
import type { UpdateBugInput } from './bugs.schema';

export async function updateBug(actorId: string, actorRole: 'ADMIN' | 'DEVELOPER' | 'TESTER', id: string, input: UpdateBugInput) {
  const bug = await prisma.bug.findUnique({ where: { id } });
  if (!bug) throw AppError.notFound('Bug not found');
  const isReporter = bug.reporterId === actorId;
  const isAdmin = actorRole === 'ADMIN';
  if (!isReporter && !isAdmin) throw AppError.forbidden();
  if (bug.status !== 'NEW') throw AppError.badRequest('Bug can only be edited while status is NEW');
  return prisma.bug.update({ where: { id }, data: input });
}

export async function deleteBug(id: string) {
  const exists = await prisma.bug.findUnique({ where: { id } });
  if (!exists) throw AppError.notFound('Bug not found');
  await prisma.bug.delete({ where: { id } });
}
```

- [ ] **Step 4: Add routes**

```ts
import { updateBugSchema } from './bugs.schema';

bugsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = updateBugSchema.parse(req.body);
    const bug = await svc.updateBug(req.user!.id, req.user!.role, req.params.id, input);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});

bugsRouter.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await svc.deleteBug(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Run, expect PASS**

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/bugs server/tests/bugs.test.ts
git commit -m "feat(server): PATCH (reporter,NEW) + DELETE (admin)"
```

---

## Task 8: `POST /api/bugs/:id/transition` (TDD — full state machine)

**Files:**
- Modify: `server/src/modules/bugs/bugs.service.ts`
- Modify: `server/src/modules/bugs/bugs.routes.ts`
- Modify: `server/tests/bugs.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
async function makeBug(status: import('@prisma/client').BugStatus, opts: { assigneeId?: string } = {}) {
  const { user: reporter } = await createUser({ role: 'TESTER' });
  return createBug({ reporterId: reporter.id, status, ...opts });
}

describe('POST /api/bugs/:id/transition', () => {
  it('admin assigns NEW → ASSIGNED with priority + assignee', async () => {
    const { cookie } = await authedAs('ADMIN');
    const { user: dev } = await createUser({ role: 'DEVELOPER' });
    const bug = await makeBug('NEW');
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'ASSIGNED', assigneeId: dev.id, priority: 'P2' });
    expect(res.status).toBe(200);
    expect(res.body.bug.status).toBe('ASSIGNED');
    expect(res.body.bug.assigneeId).toBe(dev.id);
    expect(res.body.bug.priority).toBe('P2');
  });

  it('developer assignee starts work', async () => {
    const { user: dev } = await createUser({ role: 'DEVELOPER' });
    const cookie = `token=${signJwt({ sub: dev.id, role: dev.role })}`;
    const bug = await makeBug('ASSIGNED', { assigneeId: dev.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.bug.status).toBe('IN_PROGRESS');
  });

  it('admin VERIFIED → CLOSED sets closedAt', async () => {
    const { cookie } = await authedAs('ADMIN');
    const bug = await makeBug('VERIFIED');
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'CLOSED' });
    expect(res.status).toBe(200);
    expect(res.body.bug.closedAt).toBeTruthy();
  });

  it('rejects illegal transitions with 400', async () => {
    const { cookie } = await authedAs('ADMIN');
    const bug = await makeBug('NEW');
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'CLOSED' });
    expect(res.status).toBe(400);
  });

  it('rejects developer not-assignee', async () => {
    const { user: dev2 } = await createUser({ role: 'DEVELOPER' });
    const cookie = `token=${signJwt({ sub: dev2.id, role: dev2.role })}`;
    const { user: dev1 } = await createUser({ role: 'DEVELOPER' });
    const bug = await makeBug('ASSIGNED', { assigneeId: dev1.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/transition`)
      .set('Cookie', [cookie])
      .send({ to: 'IN_PROGRESS' });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Add `transition` to service**

```ts
import { canTransition } from './lifecycle';
import type { TransitionInput } from './bugs.schema';

export async function transitionBug(
  actorId: string,
  actorRole: 'ADMIN' | 'DEVELOPER' | 'TESTER',
  id: string,
  input: TransitionInput,
) {
  const bug = await prisma.bug.findUnique({ where: { id } });
  if (!bug) throw AppError.notFound('Bug not found');

  const result = canTransition({
    fromStatus: bug.status,
    toStatus: input.to,
    actorRole,
    actorId,
    bugAssigneeId: bug.assigneeId,
    body: { assigneeId: input.assigneeId, priority: input.priority },
  });
  if (!result.ok) {
    // permission failures (assignee mismatch, role mismatch) → 403; structural → 400
    if (
      result.reason.toLowerCase().includes('only') ||
      result.reason.toLowerCase().includes('assignee')
    ) {
      throw AppError.forbidden(result.reason);
    }
    throw AppError.badRequest(result.reason);
  }

  const updates: Parameters<typeof prisma.bug.update>[0]['data'] = { status: input.to };
  if (input.to === 'ASSIGNED') {
    updates.assigneeId = input.assigneeId!;
    updates.priority = input.priority!;
  }
  if (input.to === 'CLOSED') updates.closedAt = new Date();

  return prisma.bug.update({ where: { id }, data: updates });
}
```

- [ ] **Step 4: Add route**

```ts
import { transitionSchema } from './bugs.schema';

bugsRouter.post('/:id/transition', async (req, res, next) => {
  try {
    const input = transitionSchema.parse(req.body);
    const bug = await svc.transitionBug(req.user!.id, req.user!.role, req.params.id, input);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Run, expect PASS**

Run: `npm test -- bugs.test.ts`

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/bugs server/tests/bugs.test.ts
git commit -m "feat(server): bug transition endpoint with state machine"
```

---

## Task 9: Cloudinary signature helper

**Files:**
- Create: `server/src/lib/cloudinary.ts`
- Modify: `server/package.json`

- [ ] **Step 1: Install SDK**

Run: `cd server && npm install cloudinary@2.5.1`

- [ ] **Step 2: Write `server/src/lib/cloudinary.ts`**

```ts
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../env';
import { AppError } from './http-error';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw AppError.badRequest('Cloudinary credentials missing');
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function signUpload(folder: string): UploadSignature {
  ensureConfigured();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET!,
  );
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/lib/cloudinary.ts server/package.json server/package-lock.json
git commit -m "feat(server): cloudinary signed-upload helper"
```

---

## Task 10: `POST /api/bugs/:id/screenshots` — sign + persist URLs (TDD)

**Files:**
- Modify: `server/src/modules/bugs/bugs.service.ts`
- Modify: `server/src/modules/bugs/bugs.routes.ts`
- Create: `server/tests/screenshots.test.ts`

The flow: client calls `GET /api/bugs/:id/screenshots/sign` to obtain a Cloudinary signature, uploads directly to Cloudinary, then `POST /api/bugs/:id/screenshots` with the resulting URLs to persist them on the bug. We test the persistence endpoint with the signature mocked.

- [ ] **Step 1: Write failing test `tests/screenshots.test.ts`**

```ts
import { resetDb, createUser, createBug } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';

jest.mock('../src/lib/cloudinary', () => ({
  signUpload: () => ({
    cloudName: 'demo',
    apiKey: 'k',
    timestamp: 1700000000,
    folder: 'bugs',
    signature: 'fake',
  }),
}));

beforeEach(resetDb);

describe('GET /api/bugs/:id/screenshots/sign', () => {
  it('reporter gets a signature', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .get(`/api/bugs/${bug.id}/screenshots/sign`)
      .set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.signature).toBe('fake');
    expect(res.body.cloudName).toBe('demo');
  });

  it('non-reporter cannot sign', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    const { user: other } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: other.id, role: other.role })}`;
    const bug = await createBug({ reporterId: reporter.id });
    const res = await api()
      .get(`/api/bugs/${bug.id}/screenshots/sign`)
      .set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/bugs/:id/screenshots', () => {
  const validUrl = 'https://res.cloudinary.com/demo/image/upload/bugs/abc.png';

  it('reporter persists uploaded URLs (cap 5 total)', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/screenshots`)
      .set('Cookie', [cookie])
      .send({ urls: [validUrl, validUrl] });
    expect(res.status).toBe(200);
    expect(res.body.bug.screenshots).toHaveLength(2);
  });

  it('rejects non-cloudinary URLs', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/screenshots`)
      .set('Cookie', [cookie])
      .send({ urls: ['https://evil.example.com/img.png'] });
    expect(res.status).toBe(400);
  });

  it('rejects more than 5 total screenshots', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const bug = await createBug({ reporterId: user.id });
    const res = await api()
      .post(`/api/bugs/${bug.id}/screenshots`)
      .set('Cookie', [cookie])
      .send({ urls: Array(6).fill(validUrl) });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Add `addScreenshotsSchema` to `bugs.schema.ts`**

```ts
const cloudinaryUrl = z
  .string()
  .url()
  .refine((u) => /^https:\/\/res\.cloudinary\.com\//.test(u), 'Must be a Cloudinary URL');

export const addScreenshotsSchema = z.object({
  urls: z.array(cloudinaryUrl).min(1).max(5),
});
```

- [ ] **Step 4: Add to service**

```ts
import { signUpload } from '../../lib/cloudinary';

const MAX_SCREENSHOTS = 5;

export async function getScreenshotSignature(actorId: string, bugId: string) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  if (bug.reporterId !== actorId) throw AppError.forbidden();
  return signUpload(`bugs/${bugId}`);
}

export async function addScreenshots(actorId: string, bugId: string, urls: string[]) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  if (bug.reporterId !== actorId) throw AppError.forbidden();
  const next = [...bug.screenshots, ...urls];
  if (next.length > MAX_SCREENSHOTS) {
    throw AppError.badRequest(`Max ${MAX_SCREENSHOTS} screenshots per bug`);
  }
  return prisma.bug.update({ where: { id: bugId }, data: { screenshots: next } });
}
```

- [ ] **Step 5: Add routes**

```ts
import { addScreenshotsSchema } from './bugs.schema';

bugsRouter.get('/:id/screenshots/sign', async (req, res, next) => {
  try {
    res.json(await svc.getScreenshotSignature(req.user!.id, req.params.id));
  } catch (e) {
    next(e);
  }
});

bugsRouter.post('/:id/screenshots', async (req, res, next) => {
  try {
    const { urls } = addScreenshotsSchema.parse(req.body);
    const bug = await svc.addScreenshots(req.user!.id, req.params.id, urls);
    res.json({ bug });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 6: Run, expect PASS**

Run: `npm test -- screenshots.test.ts`

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/bugs server/tests/screenshots.test.ts
git commit -m "feat(server): screenshot signed-upload + persist URLs"
```

---

## Done — Plan 2 acceptance

- [ ] Bug model migrated; Comment model added (endpoints in Plan 3)
- [ ] Lifecycle state machine has unit tests covering every legal/illegal transition
- [ ] Bug list with filters + pagination passes
- [ ] Bug create / get / update / delete enforce role + ownership rules
- [ ] Transition endpoint enforces both role and assignee checks; sets `closedAt`
- [ ] Screenshot signature returns a valid signed payload; URL persistence rejects non-cloudinary URLs and >5 total
- [ ] All Plan 1 + Plan 2 tests green; CI green
