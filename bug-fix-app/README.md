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
