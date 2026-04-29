# Plan 3 — Comments + Analytics (server) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a comments thread per bug (with author-only edit/delete), and admin-only analytics endpoints (`/stats/summary`, `/stats/developers`).

**Architecture:** Adds two slices: `modules/comments/` and `modules/stats/`. Comments live under `/api/bugs/:id/comments` for create/list and `/api/comments/:id` for edit/delete (clean URLs). Stats are read-only aggregates computed at request time (data set is small for an academic project — no caching needed). All endpoints require auth; `/stats/*` requires ADMIN.

**Tech Stack:** Same as Plan 2.

**Prereqs:** Plan 1 + Plan 2 complete (Bug + Comment tables already migrated in Plan 2 Task 1).

---

## File Structure

```
server/src/modules/
├── comments/
│   ├── comments.routes.ts
│   ├── comments.service.ts
│   └── comments.schema.ts
└── stats/
    ├── stats.routes.ts
    └── stats.service.ts

server/tests/
├── comments.test.ts
└── stats.test.ts
```

---

## Task 1: Comment zod schemas + factory helper

**Files:**
- Create: `server/src/modules/comments/comments.schema.ts`
- Modify: `server/tests/helpers/factories.ts`

- [ ] **Step 1: Write `comments.schema.ts`**

```ts
import { z } from 'zod';

export const createCommentSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const updateCommentSchema = z.object({
  text: z.string().min(1).max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
```

- [ ] **Step 2: Append `createComment` to `factories.ts`**

```ts
export async function createComment(opts: {
  bugId: string;
  authorId: string;
  text?: string;
}) {
  return prisma.comment.create({
    data: {
      bugId: opts.bugId,
      authorId: opts.authorId,
      text: opts.text ?? 'A comment',
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/comments/comments.schema.ts server/tests/helpers/factories.ts
git commit -m "feat(server): comment schemas + factory"
```

---

## Task 2: `POST /api/bugs/:id/comments` + `GET /api/bugs/:id/comments` (TDD)

**Files:**
- Create: `server/src/modules/comments/comments.service.ts`
- Create: `server/src/modules/comments/comments.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/comments.test.ts`

- [ ] **Step 1: Write failing test `tests/comments.test.ts`**

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

describe('POST /api/bugs/:id/comments', () => {
  it('any authed user can comment', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: reporter.id });
    const { user, cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'Looking into this' });
    expect(res.status).toBe(201);
    expect(res.body.comment).toMatchObject({
      text: 'Looking into this',
      authorId: user.id,
      bugId: bug.id,
    });
  });

  it('rejects empty text', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: reporter.id });
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: '' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing bug', async () => {
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .post(`/api/bugs/nope/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'hi' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/bugs/:id/comments', () => {
  it('returns comments for the bug in chronological order with author', async () => {
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const { user: a, cookie } = await authedAs('DEVELOPER');
    await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'one' });
    await api()
      .post(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie])
      .send({ text: 'two' });
    const res = await api()
      .get(`/api/bugs/${bug.id}/comments`)
      .set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].text).toBe('one');
    expect(res.body.data[0].author.id).toBe(a.id);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Write `comments.service.ts`**

```ts
import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';
import type { CreateCommentInput, UpdateCommentInput } from './comments.schema';

const authorSelect = { id: true, name: true, email: true, role: true } as const;

export async function listComments(bugId: string) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  return prisma.comment.findMany({
    where: { bugId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: authorSelect } },
  });
}

export async function createComment(authorId: string, bugId: string, input: CreateCommentInput) {
  const bug = await prisma.bug.findUnique({ where: { id: bugId } });
  if (!bug) throw AppError.notFound('Bug not found');
  return prisma.comment.create({
    data: { bugId, authorId, text: input.text },
    include: { author: { select: authorSelect } },
  });
}

export async function updateComment(
  actorId: string,
  actorRole: 'ADMIN' | 'DEVELOPER' | 'TESTER',
  id: string,
  input: UpdateCommentInput,
) {
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) throw AppError.notFound('Comment not found');
  const isAuthor = c.authorId === actorId;
  if (!isAuthor) throw AppError.forbidden('Only the author can edit');
  return prisma.comment.update({
    where: { id },
    data: { text: input.text },
    include: { author: { select: authorSelect } },
  });
}

export async function deleteComment(
  actorId: string,
  actorRole: 'ADMIN' | 'DEVELOPER' | 'TESTER',
  id: string,
) {
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) throw AppError.notFound('Comment not found');
  const isAuthor = c.authorId === actorId;
  const isAdmin = actorRole === 'ADMIN';
  if (!isAuthor && !isAdmin) throw AppError.forbidden();
  await prisma.comment.delete({ where: { id } });
}
```

- [ ] **Step 4: Write `comments.routes.ts`**

```ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { createCommentSchema, updateCommentSchema } from './comments.schema';
import * as svc from './comments.service';

// nested under /api/bugs/:id/comments
export const bugCommentsRouter = Router({ mergeParams: true });
bugCommentsRouter.use(requireAuth);

bugCommentsRouter.get('/', async (req, res, next) => {
  try {
    const data = await svc.listComments((req.params as { id: string }).id);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

bugCommentsRouter.post('/', async (req, res, next) => {
  try {
    const input = createCommentSchema.parse(req.body);
    const comment = await svc.createComment(
      req.user!.id,
      (req.params as { id: string }).id,
      input,
    );
    res.status(201).json({ comment });
  } catch (e) {
    next(e);
  }
});

// flat /api/comments/:id for edit/delete
export const commentsRouter = Router();
commentsRouter.use(requireAuth);

commentsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = updateCommentSchema.parse(req.body);
    const comment = await svc.updateComment(req.user!.id, req.user!.role, req.params.id, input);
    res.json({ comment });
  } catch (e) {
    next(e);
  }
});

commentsRouter.delete('/:id', async (req, res, next) => {
  try {
    await svc.deleteComment(req.user!.id, req.user!.role, req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Mount in `app.ts` and on the bugs router**

In `bugs.routes.ts` add:
```ts
import { bugCommentsRouter } from '../comments/comments.routes';
bugsRouter.use('/:id/comments', bugCommentsRouter);
```

In `app.ts`:
```ts
import { commentsRouter } from './modules/comments/comments.routes';
app.use('/api/comments', commentsRouter);
```

- [ ] **Step 6: Run, expect PASS**

Run: `npm test -- comments.test.ts`

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/comments server/src/modules/bugs/bugs.routes.ts server/src/app.ts server/tests/comments.test.ts
git commit -m "feat(server): comments list/create"
```

---

## Task 3: `PATCH /api/comments/:id` + `DELETE /api/comments/:id` (TDD)

**Files:**
- Modify: `server/tests/comments.test.ts`

- [ ] **Step 1: Append failing tests**

```ts
import { createComment } from './helpers/factories';

describe('PATCH /api/comments/:id', () => {
  it('author can edit own comment', async () => {
    const { user, cookie } = await authedAs('DEVELOPER');
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const c = await createComment({ bugId: bug.id, authorId: user.id });
    const res = await api()
      .patch(`/api/comments/${c.id}`)
      .set('Cookie', [cookie])
      .send({ text: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.comment.text).toBe('Updated');
  });

  it('non-author cannot edit (even admin)', async () => {
    const { user: author } = await createUser({ role: 'DEVELOPER' });
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const c = await createComment({ bugId: bug.id, authorId: author.id });
    const { cookie } = await authedAs('ADMIN');
    const res = await api()
      .patch(`/api/comments/${c.id}`)
      .set('Cookie', [cookie])
      .send({ text: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/comments/:id', () => {
  it('author can delete own comment', async () => {
    const { user, cookie } = await authedAs('DEVELOPER');
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const c = await createComment({ bugId: bug.id, authorId: user.id });
    const res = await api().delete(`/api/comments/${c.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(204);
  });

  it('admin can delete any comment', async () => {
    const { user: author } = await createUser({ role: 'DEVELOPER' });
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const c = await createComment({ bugId: bug.id, authorId: author.id });
    const { cookie } = await authedAs('ADMIN');
    const res = await api().delete(`/api/comments/${c.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(204);
  });

  it('other users cannot delete', async () => {
    const { user: author } = await createUser({ role: 'DEVELOPER' });
    const { user: r } = await createUser({ role: 'TESTER' });
    const bug = await createBug({ reporterId: r.id });
    const c = await createComment({ bugId: bug.id, authorId: author.id });
    const { cookie } = await authedAs('TESTER');
    const res = await api().delete(`/api/comments/${c.id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run, expect PASS** (routes already exist from Task 2)

Run: `npm test -- comments.test.ts`

- [ ] **Step 3: Commit**

```bash
git add server/tests/comments.test.ts
git commit -m "test(server): comments edit/delete authorization"
```

---

## Task 4: `GET /api/stats/summary` (TDD)

**Files:**
- Create: `server/src/modules/stats/stats.service.ts`
- Create: `server/src/modules/stats/stats.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/stats.test.ts`

- [ ] **Step 1: Write failing test `tests/stats.test.ts`**

```ts
import { resetDb, createUser, createBug } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';

beforeEach(resetDb);

async function adminCookie() {
  const { user } = await createUser({ role: 'ADMIN' });
  return `token=${signJwt({ sub: user.id, role: user.role })}`;
}

describe('GET /api/stats/summary', () => {
  it('returns aggregated counts', async () => {
    const { user: reporter } = await createUser({ role: 'TESTER' });
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'HIGH' });
    await createBug({ reporterId: reporter.id, status: 'NEW', severity: 'LOW' });
    await createBug({ reporterId: reporter.id, status: 'FIXED', severity: 'CRITICAL' });
    await createBug({ reporterId: reporter.id, status: 'CLOSED', severity: 'CRITICAL' });

    const res = await api().get('/api/stats/summary').set('Cookie', [await adminCookie()]);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
    expect(res.body.byStatus.NEW).toBe(2);
    expect(res.body.byStatus.FIXED).toBe(1);
    expect(res.body.byStatus.CLOSED).toBe(1);
    expect(res.body.bySeverity.HIGH).toBe(1);
    expect(res.body.bySeverity.CRITICAL).toBe(2);
    expect(res.body.byPriority).toBeDefined();
  });

  it('forbids non-admin', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const cookie = `token=${signJwt({ sub: user.id, role: user.role })}`;
    const res = await api().get('/api/stats/summary').set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Write `stats.service.ts`**

```ts
import { prisma } from '../../db';
import { SEVERITY, STATUS, PRIORITY } from '../bugs/bugs.schema';
import type { BugStatus, Severity, Priority } from '@prisma/client';

function zeroes<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

export async function summary() {
  const [byStatusRows, bySeverityRows, byPriorityRows, total] = await Promise.all([
    prisma.bug.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.bug.groupBy({ by: ['severity'], _count: { _all: true } }),
    prisma.bug.groupBy({ by: ['priority'], _count: { _all: true } }),
    prisma.bug.count(),
  ]);

  const byStatus = zeroes(STATUS) as Record<BugStatus, number>;
  byStatusRows.forEach((r) => (byStatus[r.status] = r._count._all));

  const bySeverity = zeroes(SEVERITY) as Record<Severity, number>;
  bySeverityRows.forEach((r) => (bySeverity[r.severity] = r._count._all));

  const byPriority = zeroes(PRIORITY) as Record<Priority, number>;
  byPriorityRows.forEach((r) => {
    if (r.priority) byPriority[r.priority] = r._count._all;
  });

  return { total, byStatus, bySeverity, byPriority };
}
```

- [ ] **Step 4: Write `stats.routes.ts`**

```ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import * as svc from './stats.service';

export const statsRouter = Router();
statsRouter.use(requireAuth, requireRole('ADMIN'));

statsRouter.get('/summary', async (_req, res, next) => {
  try {
    res.json(await svc.summary());
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Mount in `app.ts`**

```ts
import { statsRouter } from './modules/stats/stats.routes';
app.use('/api/stats', statsRouter);
```

- [ ] **Step 6: Run, expect PASS**

Run: `npm test -- stats.test.ts`

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/stats server/src/app.ts server/tests/stats.test.ts
git commit -m "feat(server): GET /api/stats/summary (admin)"
```

---

## Task 5: `GET /api/stats/developers` with avgFixHours (TDD)

**Files:**
- Modify: `server/src/modules/stats/stats.service.ts`
- Modify: `server/src/modules/stats/stats.routes.ts`
- Modify: `server/tests/stats.test.ts`

- [ ] **Step 1: Append failing test**

```ts
import { prisma } from '../src/db';
import type { BugStatus } from '@prisma/client';

async function bugClosedAfterMs(reporterId: string, assigneeId: string, ageMs: number) {
  const created = new Date(Date.now() - ageMs);
  return prisma.bug.create({
    data: {
      title: 'closed bug',
      description: 'x',
      stepsToReproduce: 'x',
      severity: 'MEDIUM',
      status: 'CLOSED' as BugStatus,
      reporterId,
      assigneeId,
      screenshots: [],
      createdAt: created,
      closedAt: new Date(),
    },
  });
}

describe('GET /api/stats/developers', () => {
  it('returns per-developer assigned/fixed counts and avgFixHours', async () => {
    const { user: dev } = await createUser({ role: 'DEVELOPER', email: 'd1@x.com' });
    const { user: dev2 } = await createUser({ role: 'DEVELOPER', email: 'd2@x.com' });
    const { user: reporter } = await createUser({ role: 'TESTER', email: 'r@x.com' });

    // dev: 2 closed bugs (1h, 3h fix time) + 1 open assigned
    await bugClosedAfterMs(reporter.id, dev.id, 1 * 60 * 60 * 1000);
    await bugClosedAfterMs(reporter.id, dev.id, 3 * 60 * 60 * 1000);
    await createBug({ reporterId: reporter.id, assigneeId: dev.id, status: 'IN_PROGRESS' });

    // dev2: nothing
    await createBug({ reporterId: reporter.id, assigneeId: dev2.id, status: 'ASSIGNED' });

    const cookie = await adminCookie();
    const res = await api().get('/api/stats/developers').set('Cookie', [cookie]);
    expect(res.status).toBe(200);

    const dev1Stats = res.body.data.find((d: { user: { id: string } }) => d.user.id === dev.id);
    expect(dev1Stats.assigned).toBe(3);
    expect(dev1Stats.fixed).toBe(2);
    expect(dev1Stats.avgFixHours).toBeCloseTo(2, 1);

    const dev2Stats = res.body.data.find((d: { user: { id: string } }) => d.user.id === dev2.id);
    expect(dev2Stats.assigned).toBe(1);
    expect(dev2Stats.fixed).toBe(0);
    expect(dev2Stats.avgFixHours).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Add to `stats.service.ts`**

```ts
export async function developers() {
  const devs = await prisma.user.findMany({
    where: { role: 'DEVELOPER' },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: 'asc' },
  });

  return Promise.all(
    devs.map(async (user) => {
      const [assigned, closedBugs] = await Promise.all([
        prisma.bug.count({ where: { assigneeId: user.id } }),
        prisma.bug.findMany({
          where: { assigneeId: user.id, status: 'CLOSED', closedAt: { not: null } },
          select: { createdAt: true, closedAt: true },
        }),
      ]);
      const fixed = closedBugs.length;
      const avgFixHours =
        fixed > 0
          ? closedBugs.reduce((sum, b) => sum + (b.closedAt!.getTime() - b.createdAt.getTime()), 0) /
            fixed /
            (60 * 60 * 1000)
          : null;
      return { user, assigned, fixed, avgFixHours };
    }),
  );
}
```

- [ ] **Step 4: Add route**

```ts
statsRouter.get('/developers', async (_req, res, next) => {
  try {
    const data = await svc.developers();
    res.json({ data });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Run, expect PASS**

Run: `npm test -- stats.test.ts`

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/stats server/tests/stats.test.ts
git commit -m "feat(server): GET /api/stats/developers with avgFixHours"
```

---

## Task 6: Backfill seed with sample bugs + comments

**Files:**
- Modify: `server/prisma/seed.ts`

- [ ] **Step 1: Replace `seed.ts` with a fuller version**

```ts
import { PrismaClient, Severity, BugStatus, Priority } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function findOrCreate(email: string, name: string, role: 'ADMIN' | 'DEVELOPER' | 'TESTER', password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: { email, name, role, passwordHash: await hashPassword(password) },
  });
}

async function main() {
  const admin = await findOrCreate('admin@bugfix.local', 'Admin', 'ADMIN', 'Admin1234');
  const dev1 = await findOrCreate('dev1@bugfix.local', 'Dev One', 'DEVELOPER', 'Dev12345');
  const dev2 = await findOrCreate('dev2@bugfix.local', 'Dev Two', 'DEVELOPER', 'Dev12345');
  const tester1 = await findOrCreate('tester1@bugfix.local', 'Tester One', 'TESTER', 'Test1234');
  const tester2 = await findOrCreate('tester2@bugfix.local', 'Tester Two', 'TESTER', 'Test1234');

  if ((await prisma.bug.count()) > 0) {
    console.log('seed: bugs already exist, skipping bug seed');
    return;
  }

  const fixtures: Array<{
    title: string;
    severity: Severity;
    status: BugStatus;
    priority?: Priority;
    assignee?: string;
    daysAgo: number;
  }> = [
    { title: 'Login button stuck on Chrome 121', severity: 'CRITICAL', status: 'NEW', daysAgo: 0 },
    { title: 'Sign-up form validates email twice', severity: 'LOW', status: 'NEW', daysAgo: 0 },
    { title: 'Profile picture distorts on mobile', severity: 'MEDIUM', status: 'ASSIGNED', priority: 'P3', assignee: dev1.id, daysAgo: 1 },
    { title: 'Search returns 0 results for valid query', severity: 'HIGH', status: 'IN_PROGRESS', priority: 'P2', assignee: dev1.id, daysAgo: 2 },
    { title: 'Dashboard chart legend overlaps', severity: 'LOW', status: 'IN_PROGRESS', priority: 'P4', assignee: dev2.id, daysAgo: 1 },
    { title: 'Password reset email never arrives', severity: 'CRITICAL', status: 'FIXED', priority: 'P1', assignee: dev2.id, daysAgo: 3 },
    { title: 'Comments break with markdown special chars', severity: 'MEDIUM', status: 'FIXED', priority: 'P3', assignee: dev1.id, daysAgo: 4 },
    { title: 'Drag-and-drop attachment fails on Safari', severity: 'HIGH', status: 'VERIFIED', priority: 'P2', assignee: dev2.id, daysAgo: 5 },
    { title: 'Old session not cleared after logout', severity: 'CRITICAL', status: 'CLOSED', priority: 'P1', assignee: dev1.id, daysAgo: 10 },
    { title: 'Localized date format wrong in Mexico', severity: 'LOW', status: 'CLOSED', priority: 'P4', assignee: dev2.id, daysAgo: 8 },
    { title: 'Invoice PDF download corrupts', severity: 'HIGH', status: 'CLOSED', priority: 'P2', assignee: dev1.id, daysAgo: 12 },
    { title: 'Tooltip clipped at viewport edge', severity: 'LOW', status: 'NEW', daysAgo: 0 },
  ];

  for (const f of fixtures) {
    const created = new Date(Date.now() - f.daysAgo * 86400 * 1000);
    const closedAt = f.status === 'CLOSED' ? new Date(created.getTime() + 6 * 60 * 60 * 1000) : null;
    const reporter = Math.random() > 0.5 ? tester1 : tester2;
    await prisma.bug.create({
      data: {
        title: f.title,
        description: 'Reproducible on staging.',
        stepsToReproduce: '1. Open the page\n2. Trigger the action\n3. Observe the issue',
        severity: f.severity,
        priority: f.priority ?? null,
        status: f.status,
        reporterId: reporter.id,
        assigneeId: f.assignee ?? null,
        createdAt: created,
        closedAt,
        screenshots: [],
      },
    });
  }

  // a couple of comments on the first NEW bug for demo
  const firstBug = await prisma.bug.findFirst({ where: { status: 'NEW' } });
  if (firstBug) {
    await prisma.comment.create({
      data: { bugId: firstBug.id, authorId: dev1.id, text: 'Reproduced on Chrome 121, looking now.' },
    });
    await prisma.comment.create({
      data: { bugId: firstBug.id, authorId: tester1.id, text: 'Thanks — happens on staging too.' },
    });
  }

  console.log('seed: created', fixtures.length, 'bugs and 2 comments');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Reset dev DB and re-seed**

Run:
```bash
cd server
npx prisma migrate reset --force
npm run seed
```

- [ ] **Step 3: Verify with curl**

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bugfix.local","password":"Admin1234"}' \
  -c - | grep token | awk '{print $7}')
curl -s "http://localhost:4000/api/stats/summary" -H "Cookie: token=$TOKEN" | jq
```

Expected: JSON with non-zero counts.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/seed.ts
git commit -m "chore(server): seed sample bugs + comments for demo"
```

---

## Done — Plan 3 acceptance

- [ ] Comment list/create routes return author with proper joins
- [ ] Author-only edit; author or admin delete; everyone else 403
- [ ] `/stats/summary` returns counts by status/severity/priority with zeros filled in
- [ ] `/stats/developers` returns one row per developer including `avgFixHours` (null when no closed bugs)
- [ ] Seed creates 3 users + 12 bugs across all statuses + 2 sample comments
- [ ] All Plan 1–3 server tests green; CI green
