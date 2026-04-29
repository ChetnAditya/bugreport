# Plan 1 — Foundation + Auth (server) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the monorepo, Express + TypeScript server, PostgreSQL via Prisma, and a fully tested JWT auth + user-management surface. End state: a developer can register, log in (httpOnly cookie), call `/auth/me`, and admins can list/promote users — all with CI green.

**Architecture:** Single repo, two folders (`client/`, `server/`). Server is Express + TS, Prisma over Postgres, JWT issued in httpOnly cookie. Tests with Jest + Supertest hit a real Postgres test DB via docker compose. CI runs lint → typecheck → tests on every PR.

**Tech Stack:** Node 20, TypeScript 5, Express 4, Prisma 5, PostgreSQL 16, jsonwebtoken, bcrypt, zod, helmet, cors, cookie-parser, express-rate-limit, Jest 29, Supertest 6, ts-jest, tsx, eslint, prettier.

---

## File Structure

```
bug-fix-app/  (D:\ChetanAditya)
├── .gitignore
├── docker-compose.yml
├── package.json                     workspace root (just convenience scripts)
├── README.md
├── .github/workflows/ci.yml
├── docs/superpowers/
│   ├── specs/
│   └── plans/
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.ts
    ├── .eslintrc.json
    ├── .prettierrc
    ├── .env.example
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    ├── src/
    │   ├── index.ts                 entry point
    │   ├── app.ts                   Express app factory (testable)
    │   ├── env.ts                   typed env loader
    │   ├── db.ts                    Prisma singleton
    │   ├── lib/
    │   │   ├── jwt.ts               sign/verify
    │   │   ├── password.ts          bcrypt wrapper
    │   │   └── http-error.ts        AppError + handler
    │   ├── middleware/
    │   │   ├── require-auth.ts
    │   │   ├── require-role.ts
    │   │   ├── error-handler.ts
    │   │   └── rate-limit.ts
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── auth.routes.ts
    │   │   │   ├── auth.service.ts
    │   │   │   └── auth.schema.ts
    │   │   └── users/
    │   │       ├── users.routes.ts
    │   │       ├── users.service.ts
    │   │       └── users.schema.ts
    │   └── types/express.d.ts       extends Request with `user`
    └── tests/
        ├── helpers/
        │   ├── factories.ts         createUser(), etc.
        │   └── api.ts               supertest agent helper
        ├── auth.test.ts
        ├── middleware.test.ts
        └── users.test.ts
```

**Boundary discipline:**
- `modules/<name>/` = feature slice (routes + service + schema). No cross-imports between modules; share via `lib/`.
- `app.ts` is plain factory: takes nothing, returns Express app. `index.ts` only wires the listener. Tests import `app` directly.
- `db.ts` exports a single Prisma client instance reused across modules and tests.
- Migrations are applied via the `pretest` npm script — tests never spawn child processes.

---

## Task 1: Initialize monorepo root + gitignore + docker compose

**Files:**
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `package.json` (root)
- Create: `README.md`

- [ ] **Step 1: Write `.gitignore`**

```gitignore
# deps
node_modules/
# build
dist/
build/
.next/
.vite/
# env
.env
.env.*.local
# logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
# editor
.vscode/
.idea/
.DS_Store
# tests
coverage/
.nyc_output/
```

- [ ] **Step 2: Write `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: bugfix_pg
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: bugfix
      POSTGRES_PASSWORD: bugfix
      POSTGRES_DB: bugfix_dev
    volumes:
      - bugfix_pgdata:/var/lib/postgresql/data
  postgres_test:
    image: postgres:16-alpine
    container_name: bugfix_pg_test
    restart: unless-stopped
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: bugfix
      POSTGRES_PASSWORD: bugfix
      POSTGRES_DB: bugfix_test
volumes:
  bugfix_pgdata:
```

- [ ] **Step 3: Write root `package.json`**

```json
{
  "name": "bug-fix-app",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "db:up": "docker compose up -d postgres postgres_test",
    "db:down": "docker compose down",
    "server:dev": "npm --prefix server run dev",
    "server:test": "npm --prefix server run test",
    "client:dev": "npm --prefix client run dev"
  }
}
```

- [ ] **Step 4: Write minimal `README.md`**

```markdown
# Bug Fix Web App

See `docs/superpowers/specs/2026-04-27-bug-fix-web-app-design.md` for the design.

## Quick start

\`\`\`bash
npm run db:up
cd server && npm install && npx prisma migrate dev && npm run dev
\`\`\`
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore docker-compose.yml package.json README.md
git commit -m "chore: scaffold monorepo root + docker compose"
```

---

## Task 2: Server scaffold — TypeScript + scripts

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.eslintrc.json`
- Create: `server/.prettierrc`
- Create: `server/.env.example`

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "@bugfix/server",
  "version": "0.0.1",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "pretest": "DOTENV_CONFIG_PATH=.env.test npx prisma migrate deploy",
    "test": "DOTENV_CONFIG_PATH=.env.test jest --runInBand",
    "test:watch": "jest --watch --runInBand",
    "lint": "eslint \"src/**/*.ts\" \"tests/**/*.ts\"",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "5.22.0",
    "bcrypt": "5.1.1",
    "cookie-parser": "1.4.7",
    "cors": "2.8.5",
    "dotenv": "16.4.7",
    "express": "4.21.2",
    "express-rate-limit": "7.5.0",
    "helmet": "8.0.0",
    "jsonwebtoken": "9.0.2",
    "morgan": "1.10.0",
    "zod": "3.24.1"
  },
  "devDependencies": {
    "@types/bcrypt": "5.0.2",
    "@types/cookie-parser": "1.4.8",
    "@types/cors": "2.8.17",
    "@types/express": "4.17.21",
    "@types/jest": "29.5.14",
    "@types/jsonwebtoken": "9.0.7",
    "@types/morgan": "1.9.9",
    "@types/node": "20.11.5",
    "@types/supertest": "6.0.2",
    "@typescript-eslint/eslint-plugin": "8.18.2",
    "@typescript-eslint/parser": "8.18.2",
    "eslint": "8.57.1",
    "jest": "29.7.0",
    "prettier": "3.4.2",
    "prisma": "5.22.0",
    "supertest": "7.0.0",
    "ts-jest": "29.2.5",
    "tsx": "4.19.2",
    "typescript": "5.7.2"
  }
}
```

- [ ] **Step 2: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*", "tests/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `server/.eslintrc.json`**

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "env": { "node": true, "jest": true, "es2022": true },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

- [ ] **Step 4: Create `server/.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 5: Create `server/.env.example`**

```bash
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

- [ ] **Step 6: Install deps**

Run: `cd server && npm install`
Expected: deps installed, no errors.

- [ ] **Step 7: Copy `.env.example` to `.env` (local only, not committed)**

Run: `cp .env.example .env`

- [ ] **Step 8: Commit**

```bash
git add server/package.json server/tsconfig.json server/.eslintrc.json server/.prettierrc server/.env.example server/package-lock.json
git commit -m "chore(server): scaffold TS + tooling"
```

---

## Task 3: Prisma init + User model + first migration

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/db.ts`

- [ ] **Step 1: Write `server/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  DEVELOPER
  TESTER
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  role         Role     @default(TESTER)
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 2: Run first migration**

Run (from `server/`): `npx prisma migrate dev --name init`
Expected: migration created in `prisma/migrations/<timestamp>_init/`, Prisma client generated.

- [ ] **Step 3: Write `server/src/db.ts`**

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Commit**

```bash
git add server/prisma server/src/db.ts
git commit -m "feat(server): prisma init + User model"
```

---

## Task 4: Typed env loader + entry point + app factory

**Files:**
- Create: `server/src/env.ts`
- Create: `server/src/types/express.d.ts`
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`
- Create: `server/src/middleware/error-handler.ts` (stub, replaced in Task 5)

- [ ] **Step 1: Write `server/src/env.ts`**

```ts
import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
```

- [ ] **Step 2: Write `server/src/types/express.d.ts`**

```ts
import 'express';
import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}
export {};
```

- [ ] **Step 3: Write `server/src/middleware/error-handler.ts`** (stub — full version in Task 5)

```ts
import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal error' } });
};
```

- [ ] **Step 4: Write `server/src/app.ts`** (routes mounted in later tasks)

```ts
import express, { type Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env';
import { errorHandler } from './middleware/error-handler';

export function createApp(): Application {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan('tiny'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // module routes mounted here in later tasks

  app.use(errorHandler);
  return app;
}
```

- [ ] **Step 5: Write `server/src/index.ts`**

```ts
import { createApp } from './app';
import { env } from './env';

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`server listening on :${env.PORT}`);
});
```

- [ ] **Step 6: Verify boot**

Run: `cd server && npm run dev`
Expected: `server listening on :4000`. `curl http://localhost:4000/api/health` → `{"ok":true}`. Stop with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add server/src
git commit -m "feat(server): app factory + env loader + health route"
```

---

## Task 5: AppError class + error handler + lib helpers

**Files:**
- Create: `server/src/lib/http-error.ts`
- Modify: `server/src/middleware/error-handler.ts`
- Create: `server/src/lib/jwt.ts`
- Create: `server/src/lib/password.ts`

- [ ] **Step 1: Write `server/src/lib/http-error.ts`**

```ts
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Not authenticated') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }
  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }
}
```

- [ ] **Step 2: Replace `server/src/middleware/error-handler.ts`**

```ts
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/http-error';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION', message: 'Invalid input', details: err.flatten() },
    });
  }
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal error' } });
};
```

- [ ] **Step 3: Write `server/src/lib/jwt.ts`**

```ts
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../env';

export interface JwtPayload {
  sub: string;
  role: Role;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
}

export function verifyJwt(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  if (typeof decoded === 'string') throw new Error('invalid token');
  return decoded as JwtPayload;
}
```

- [ ] **Step 4: Write `server/src/lib/password.ts`**

```ts
import bcrypt from 'bcrypt';

const COST = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
```

- [ ] **Step 5: Commit**

```bash
git add server/src/lib server/src/middleware/error-handler.ts
git commit -m "feat(server): AppError + lib (jwt, password) helpers"
```

---

## Task 6: Test infrastructure — Jest config, test env, supertest helpers

**Files:**
- Create: `server/jest.config.ts`
- Create: `server/.env.test`
- Create: `server/tests/helpers/api.ts`
- Create: `server/tests/helpers/factories.ts`

- [ ] **Step 1: Write `server/jest.config.ts`**

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testTimeout: 20000,
  clearMocks: true,
};

export default config;
```

- [ ] **Step 2: Write `server/.env.test`** (committed; safe values for test DB)

```bash
NODE_ENV=test
PORT=4001
DATABASE_URL=postgresql://bugfix:bugfix@localhost:5433/bugfix_test
JWT_SECRET=test-secret-must-be-at-least-32-bytes-long
CLIENT_ORIGIN=http://localhost:5173
COOKIE_DOMAIN=
COOKIE_SECURE=false
```

Migrations run via the `pretest` npm script defined in Task 2.

- [ ] **Step 3: Write `server/tests/helpers/api.ts`**

```ts
import request from 'supertest';
import { createApp } from '../../src/app';

export const api = () => request(createApp());
```

- [ ] **Step 4: Write `server/tests/helpers/factories.ts`**

```ts
import { prisma } from '../../src/db';
import { hashPassword } from '../../src/lib/password';
import type { Role } from '@prisma/client';

export async function resetDb() {
  await prisma.user.deleteMany();
}

export async function createUser(opts: {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
} = {}) {
  const email = opts.email ?? `u${Date.now()}${Math.random()}@example.com`;
  const password = opts.password ?? 'Passw0rd!';
  const user = await prisma.user.create({
    data: {
      email,
      name: opts.name ?? 'Test User',
      passwordHash: await hashPassword(password),
      role: opts.role ?? 'TESTER',
    },
  });
  return { user, password };
}
```

- [ ] **Step 5: Verify Jest boots with no tests yet**

Make sure `npm run db:up` is running (test Postgres on :5433).

Run: `cd server && npm test -- --passWithNoTests`
Expected: `pretest` runs `prisma migrate deploy` against the test DB, then Jest exits 0 with "No tests found".

- [ ] **Step 6: Commit**

```bash
git add server/jest.config.ts server/.env.test server/tests
git commit -m "test(server): jest + supertest infra + factories"
```

---

## Task 7: `requireAuth` middleware (TDD)

**Files:**
- Create: `server/src/middleware/require-auth.ts`
- Create: `server/tests/middleware.test.ts`

- [ ] **Step 1: Write the failing test `server/tests/middleware.test.ts`**

```ts
import { resetDb, createUser } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';

beforeEach(resetDb);

describe('requireAuth', () => {
  it('rejects requests with no cookie', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('accepts requests with a valid cookie', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const token = signJwt({ sub: user.id, role: user.role });
    const res = await api().get('/api/auth/me').set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});
```

- [ ] **Step 2: Run test to see it fail**

Run: `npm test -- middleware.test.ts`
Expected: FAIL — `/api/auth/me` returns 404.

- [ ] **Step 3: Write `server/src/middleware/require-auth.ts`**

```ts
import type { RequestHandler } from 'express';
import { verifyJwt } from '../lib/jwt';
import { AppError } from '../lib/http-error';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.token ?? extractBearer(req.header('authorization'));
  if (!token) return next(AppError.unauthorized());
  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
};

function extractBearer(header: string | undefined): string | undefined {
  if (!header?.toLowerCase().startsWith('bearer ')) return undefined;
  return header.slice(7).trim();
}
```

- [ ] **Step 4: Mount a temporary `/api/auth/me` route in `app.ts`** (replaced in Task 9)

In `server/src/app.ts`, before `app.use(errorHandler)`:
```ts
import { requireAuth } from './middleware/require-auth';
import { prisma } from './db';

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 5: Run test to confirm pass**

Run: `npm test -- middleware.test.ts`
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/require-auth.ts server/src/app.ts server/tests/middleware.test.ts
git commit -m "feat(server): requireAuth middleware + tests"
```

---

## Task 8: `requireRole` middleware (TDD)

**Files:**
- Create: `server/src/middleware/require-role.ts`
- Modify: `server/tests/middleware.test.ts`

- [ ] **Step 1: Append failing tests to `middleware.test.ts`**

```ts
import { Role } from '@prisma/client';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { requireAuth } from '../src/middleware/require-auth';
import { requireRole } from '../src/middleware/require-role';
import { errorHandler } from '../src/middleware/error-handler';

function buildApp() {
  const app = express();
  app.use(cookieParser());
  app.get('/admin', requireAuth, requireRole('ADMIN'), (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

describe('requireRole', () => {
  it('allows the matching role', async () => {
    const { user } = await createUser({ role: 'ADMIN' });
    const token = signJwt({ sub: user.id, role: user.role });
    const res = await request(buildApp()).get('/admin').set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(200);
  });

  it('forbids other roles', async () => {
    const { user } = await createUser({ role: 'TESTER' });
    const token = signJwt({ sub: user.id, role: user.role });
    const res = await request(buildApp()).get('/admin').set('Cookie', [`token=${token}`]);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (`require-role` not found)

Run: `npm test -- middleware.test.ts`

- [ ] **Step 3: Write `server/src/middleware/require-role.ts`**

```ts
import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../lib/http-error';

export const requireRole = (...allowed: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };
};
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm test -- middleware.test.ts`

- [ ] **Step 5: Commit**

```bash
git add server/src/middleware/require-role.ts server/tests/middleware.test.ts
git commit -m "feat(server): requireRole middleware + tests"
```

---

## Task 9: `/auth/register` (TDD)

**Files:**
- Create: `server/src/modules/auth/auth.schema.ts`
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/auth.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/auth.test.ts`

- [ ] **Step 1: Write failing test `server/tests/auth.test.ts`**

```ts
import { resetDb } from './helpers/factories';
import { api } from './helpers/api';
import { prisma } from '../src/db';

beforeEach(resetDb);

describe('POST /api/auth/register', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', password: 'Passw0rd!' };

  it('creates a user with TESTER role and returns a session cookie', async () => {
    const res = await api().post('/api/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: valid.email, role: 'TESTER' });
    expect(res.body.user.passwordHash).toBeUndefined();
    const setCookie = res.headers['set-cookie']?.[0] ?? '';
    expect(setCookie).toContain('token=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('rejects invalid email', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('rejects weak password', async () => {
    const res = await api().post('/api/auth/register').send({ ...valid, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate email', async () => {
    await api().post('/api/auth/register').send(valid);
    const res = await api().post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('persists a bcrypt-hashed password', async () => {
    await api().post('/api/auth/register').send(valid);
    const row = await prisma.user.findUnique({ where: { email: valid.email } });
    expect(row?.passwordHash).not.toBe(valid.password);
    expect(row?.passwordHash.startsWith('$2')).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (route 404)

Run: `npm test -- auth.test.ts`

- [ ] **Step 3: Write `server/src/modules/auth/auth.schema.ts`**

```ts
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Must contain a letter')
  .regex(/[0-9]/, 'Must contain a number');

export const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 4: Write `server/src/modules/auth/auth.service.ts`**

```ts
import { prisma } from '../../db';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signJwt } from '../../lib/jwt';
import { AppError } from '../../lib/http-error';
import type { RegisterInput, LoginInput } from './auth.schema';

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;

export async function register(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw AppError.conflict('Email already registered');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
    },
    select: safeUserSelect,
  });
  const token = signJwt({ sub: user.id, role: user.role });
  return { user, token };
}

export async function login(input: LoginInput) {
  const row = await prisma.user.findUnique({ where: { email: input.email } });
  if (!row) throw AppError.unauthorized('Invalid credentials');
  const ok = await verifyPassword(input.password, row.passwordHash);
  if (!ok) throw AppError.unauthorized('Invalid credentials');
  const { passwordHash: _ph, ...user } = row;
  const token = signJwt({ sub: user.id, role: user.role });
  return { user, token };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });
  if (!user) throw AppError.unauthorized();
  return user;
}
```

- [ ] **Step 5: Write `server/src/modules/auth/auth.routes.ts`**

```ts
import { Router, type Response } from 'express';
import { env } from '../../env';
import { registerSchema, loginSchema } from './auth.schema';
import * as svc from './auth.service';
import { requireAuth } from '../../middleware/require-auth';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const { user, token } = await svc.register(input);
    setAuthCookie(res, token);
    res.status(201).json({ user, token });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await svc.login(input);
    setAuthCookie(res, token);
    res.json({ user, token });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await svc.me(req.user!.id);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 6: Mount router in `app.ts`**

Replace the temporary `/api/auth/me` block. Final relevant section:
```ts
import { authRouter } from './modules/auth/auth.routes';
// ... after middleware setup, before errorHandler:
app.use('/api/auth', authRouter);
```

- [ ] **Step 7: Run register tests, expect PASS**

Run: `npm test -- auth.test.ts`

- [ ] **Step 8: Commit**

```bash
git add server/src/modules/auth server/src/app.ts server/tests/auth.test.ts
git commit -m "feat(server): /auth/register with TDD"
```

---

## Task 10: `/auth/login` + `/auth/me` + `/auth/logout` (TDD)

**Files:**
- Modify: `server/tests/auth.test.ts`

- [ ] **Step 1: Append login/me/logout tests**

```ts
import { createUser } from './helpers/factories';

describe('POST /api/auth/login', () => {
  it('returns user + cookie on valid creds', async () => {
    const { user, password } = await createUser({ email: 'a@b.com' });
    const res = await api().post('/api/auth/login').send({ email: 'a@b.com', password });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.headers['set-cookie']?.[0]).toContain('token=');
  });

  it('rejects wrong password', async () => {
    await createUser({ email: 'a@b.com', password: 'Right1234' });
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'Wrong1234' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unknown email with same error', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'no@one.com', password: 'Whatever1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const { user, password } = await createUser({ email: 'me@x.com' });
    const login = await api().post('/api/auth/login').send({ email: 'me@x.com', password });
    const cookie = login.headers['set-cookie']?.[0] ?? '';
    const res = await api().get('/api/auth/me').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const res = await api().post('/api/auth/logout');
    expect(res.status).toBe(204);
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(/token=;/);
  });
});
```

- [ ] **Step 2: Run, expect PASS**

Run: `npm test -- auth.test.ts`

- [ ] **Step 3: Commit**

```bash
git add server/tests/auth.test.ts
git commit -m "test(server): /auth/login + /me + /logout"
```

---

## Task 11: Login rate-limit (TDD)

**Files:**
- Create: `server/src/middleware/rate-limit.ts`
- Modify: `server/src/modules/auth/auth.routes.ts`
- Modify: `server/tests/auth.test.ts`

- [ ] **Step 1: Append failing test**

```ts
describe('login rate-limit', () => {
  it('returns 429 after 5 failed attempts in a row', async () => {
    await createUser({ email: 'rl@x.com', password: 'Right1234' });
    const bad = { email: 'rl@x.com', password: 'WrongOne1' };
    for (let i = 0; i < 5; i++) {
      const r = await api().post('/api/auth/login').send(bad);
      expect(r.status).toBe(401);
    }
    const sixth = await api().post('/api/auth/login').send(bad);
    expect(sixth.status).toBe(429);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm test -- auth.test.ts -t "rate-limit"`

- [ ] **Step 3: Write `server/src/middleware/rate-limit.ts`**

```ts
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Too many login attempts' } },
});
```

- [ ] **Step 4: Apply limiter in `auth.routes.ts`**

Add at top:
```ts
import { loginLimiter } from '../../middleware/rate-limit';
```
Modify login route:
```ts
authRouter.post('/login', loginLimiter, async (req, res, next) => { /* unchanged body */ });
```

- [ ] **Step 5: Run, expect PASS**

Run: `npm test -- auth.test.ts`

- [ ] **Step 6: Commit**

```bash
git add server/src/middleware/rate-limit.ts server/src/modules/auth/auth.routes.ts server/tests/auth.test.ts
git commit -m "feat(server): rate-limit /auth/login (5/min)"
```

---

## Task 12: Users module — list + get + role change (TDD)

**Files:**
- Create: `server/src/modules/users/users.schema.ts`
- Create: `server/src/modules/users/users.service.ts`
- Create: `server/src/modules/users/users.routes.ts`
- Modify: `server/src/app.ts`
- Create: `server/tests/users.test.ts`

- [ ] **Step 1: Write failing tests `server/tests/users.test.ts`**

```ts
import { resetDb, createUser } from './helpers/factories';
import { api } from './helpers/api';
import { signJwt } from '../src/lib/jwt';
import type { Role } from '@prisma/client';

beforeEach(resetDb);

async function authedAs(role: Role) {
  const { user } = await createUser({ role });
  const token = signJwt({ sub: user.id, role: user.role });
  return { user, cookie: `token=${token}` };
}

describe('GET /api/users', () => {
  it('admin can list users, optionally filtered by role', async () => {
    await createUser({ email: 'd@x.com', role: 'DEVELOPER' });
    await createUser({ email: 't@x.com', role: 'TESTER' });
    const { cookie } = await authedAs('ADMIN');
    const res = await api().get('/api/users?role=DEVELOPER').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].role).toBe('DEVELOPER');
    expect(res.body.data[0].passwordHash).toBeUndefined();
  });

  it('non-admin gets 403', async () => {
    const { cookie } = await authedAs('TESTER');
    const res = await api().get('/api/users').set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/users/:id/role', () => {
  it('admin can promote a user to DEVELOPER', async () => {
    const { user: target } = await createUser({ role: 'TESTER' });
    const { cookie } = await authedAs('ADMIN');
    const res = await api()
      .patch(`/api/users/${target.id}/role`)
      .set('Cookie', [cookie])
      .send({ role: 'DEVELOPER' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('DEVELOPER');
  });

  it('non-admin cannot change roles', async () => {
    const { user: target } = await createUser({ role: 'TESTER' });
    const { cookie } = await authedAs('DEVELOPER');
    const res = await api()
      .patch(`/api/users/${target.id}/role`)
      .set('Cookie', [cookie])
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });

  it('returns 404 on missing user', async () => {
    const { cookie } = await authedAs('ADMIN');
    const res = await api()
      .patch('/api/users/does-not-exist/role')
      .set('Cookie', [cookie])
      .send({ role: 'DEVELOPER' });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm test -- users.test.ts`

- [ ] **Step 3: Write `server/src/modules/users/users.schema.ts`**

```ts
import { z } from 'zod';

export const listUsersQuery = z.object({
  role: z.enum(['ADMIN', 'DEVELOPER', 'TESTER']).optional(),
});

export const changeRoleBody = z.object({
  role: z.enum(['ADMIN', 'DEVELOPER', 'TESTER']),
});
```

- [ ] **Step 4: Write `server/src/modules/users/users.service.ts`**

```ts
import { prisma } from '../../db';
import { AppError } from '../../lib/http-error';
import type { Role } from '@prisma/client';

const safeSelect = { id: true, email: true, name: true, role: true, createdAt: true } as const;

export async function listUsers(filter: { role?: Role }) {
  return prisma.user.findMany({
    where: filter.role ? { role: filter.role } : undefined,
    orderBy: { createdAt: 'desc' },
    select: safeSelect,
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
  if (!user) throw AppError.notFound('User not found');
  return user;
}

export async function changeRole(id: string, role: Role) {
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw AppError.notFound('User not found');
  return prisma.user.update({ where: { id }, data: { role }, select: safeSelect });
}
```

- [ ] **Step 5: Write `server/src/modules/users/users.routes.ts`**

```ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import { listUsersQuery, changeRoleBody } from './users.schema';
import * as svc from './users.service';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const q = listUsersQuery.parse(req.query);
    const data = await svc.listUsers(q);
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

usersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await svc.getUser(req.params.id);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

usersRouter.patch('/:id/role', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const body = changeRoleBody.parse(req.body);
    const user = await svc.changeRole(req.params.id, body.role);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
```

- [ ] **Step 6: Mount in `app.ts`**

```ts
import { usersRouter } from './modules/users/users.routes';
// ...
app.use('/api/users', usersRouter);
```

- [ ] **Step 7: Run, expect PASS**

Run: `npm test -- users.test.ts`

- [ ] **Step 8: Commit**

```bash
git add server/src/modules/users server/src/app.ts server/tests/users.test.ts
git commit -m "feat(server): users module (list/get/role-change) with TDD"
```

---

## Task 13: Seed script (first admin + sample users)

**Files:**
- Create: `server/prisma/seed.ts`

- [ ] **Step 1: Write `server/prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@bugfix.local';
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (exists) {
    console.log('seed: admin already exists, skipping user seed');
    return;
  }
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: await hashPassword('Admin1234'),
      role: 'ADMIN',
    },
  });
  await prisma.user.create({
    data: {
      email: 'dev1@bugfix.local',
      name: 'Dev One',
      passwordHash: await hashPassword('Dev12345'),
      role: 'DEVELOPER',
    },
  });
  await prisma.user.create({
    data: {
      email: 'tester1@bugfix.local',
      name: 'Tester One',
      passwordHash: await hashPassword('Test1234'),
      role: 'TESTER',
    },
  });
  console.log('seed: created admin/dev/tester');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run seed**

Run (in `server/`): `npm run seed`
Expected: prints "seed: created admin/dev/tester".

- [ ] **Step 3: Verify with login**

Start dev server, then:
```bash
curl -i -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bugfix.local","password":"Admin1234"}'
```
Expected: 200, `Set-Cookie: token=...; HttpOnly`.

- [ ] **Step 4: Commit**

```bash
git add server/prisma/seed.ts
git commit -m "chore(server): seed script for admin/dev/tester"
```

---

## Task 14: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  server:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: bugfix
          POSTGRES_PASSWORD: bugfix
          POSTGRES_DB: bugfix_test
        ports: ['5433:5432']
        options: >-
          --health-cmd "pg_isready -U bugfix"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      NODE_ENV: test
      DATABASE_URL: postgresql://bugfix:bugfix@localhost:5433/bugfix_test
      JWT_SECRET: ci-secret-must-be-at-least-32-bytes-long
      CLIENT_ORIGIN: http://localhost:5173
      COOKIE_DOMAIN: ''
      COOKIE_SECURE: 'false'
    defaults:
      run:
        working-directory: server
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: server/package-lock.json
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

- [ ] **Step 2: Push branch + open PR; verify CI green**

```bash
git checkout -b plan-1-foundation-auth
git push -u origin plan-1-foundation-auth
```
Open PR. Confirm CI passes.

- [ ] **Step 3: Commit (workflow file)**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint + typecheck + server tests on PR"
```

---

## Done — Plan 1 acceptance

- [ ] `docker compose up -d` brings both Postgres up
- [ ] `cd server && npm test` is green (auth + middleware + users)
- [ ] Manual: register → login → /me → logout works against dev DB
- [ ] CI green on PR
- [ ] Admin can promote a user via `PATCH /api/users/:id/role`
- [ ] Login rate-limit kicks in after 5 failures
