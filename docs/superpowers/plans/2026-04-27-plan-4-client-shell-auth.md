# Plan 4 — Client Shell + Design System + Auth Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up the React client with Vite + TypeScript + Tailwind + shadcn/ui, encode the "Field Report" design tokens, build the AppShell (TopBar + SideNav + BottomNav), wire React Router + react-query, and deliver fully tested login/register/profile pages plus AuthGuard/RoleGuard. End state: a real user can register, log in (httpOnly cookie shared with server from Plan 1), see their profile, and log out.

**Architecture:** Single `client/` package using Vite. Tailwind drives all styling, with semantic CSS variables for the Field Report theme (dark by default). shadcn/ui components are installed via the CLI and lightly themed. `axios` calls the server with `withCredentials: true`. Server state lives in `@tanstack/react-query`; UI auth state (decoded user) lives in `zustand`. Tests use Vitest + React Testing Library + MSW; jest-axe smoke-checks accessibility.

**Tech Stack:** React 18, Vite 6, TypeScript 5.7, Tailwind 3.4, shadcn/ui, lucide-react, framer-motion, axios, @tanstack/react-query 5, zustand, react-router 6, react-hook-form, zod, sonner (toasts), Vitest, @testing-library/react, jsdom, msw 2, jest-axe.

**Prereqs:** Plan 1 server is reachable on `http://localhost:4000` and CORS allows `http://localhost:5173`.

---

## File Structure

```
client/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json                  shadcn config
├── index.html
├── .env                             VITE_API_URL=http://localhost:4000
├── .env.example
├── public/
└── src/
    ├── main.tsx                     bootstrap
    ├── App.tsx                      router root
    ├── index.css                    Tailwind directives + design tokens
    ├── lib/
    │   ├── api.ts                   axios instance
    │   ├── query-client.ts          react-query
    │   └── utils.ts                 cn() etc (shadcn helper)
    ├── styles/
    │   └── fonts.css                @font-face + variable axes
    ├── stores/
    │   └── auth.ts                  zustand store
    ├── hooks/
    │   ├── use-auth.ts              login/register/logout/me
    │   └── use-current-user.ts
    ├── components/
    │   ├── ui/                      shadcn primitives (generated)
    │   ├── shell/
    │   │   ├── AppShell.tsx
    │   │   ├── TopBar.tsx
    │   │   ├── SideNav.tsx
    │   │   └── BottomNav.tsx
    │   ├── auth/
    │   │   ├── AuthGuard.tsx
    │   │   ├── RoleGuard.tsx
    │   │   ├── LoginForm.tsx
    │   │   └── RegisterForm.tsx
    │   └── common/
    │       ├── ThemedToaster.tsx
    │       ├── DotGridBackground.tsx
    │       └── SkipLink.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── ProfilePage.tsx
    │   ├── ForbiddenPage.tsx
    │   └── NotFoundPage.tsx
    ├── types/
    │   └── domain.ts                shared TS types matching server DTOs
    └── tests/
        ├── setup.ts                 vitest globals + msw + jest-axe
        ├── msw/
        │   ├── handlers.ts
        │   └── server.ts
        ├── pages/
        │   ├── LoginPage.test.tsx
        │   └── RegisterPage.test.tsx
        └── components/
            └── AuthGuard.test.tsx
```

**Boundary discipline:**
- One responsibility per file. AppShell composes — does not contain logic.
- Pages own routing concerns and composition; components are presentational.
- All server I/O goes through `lib/api.ts` and react-query hooks; no `fetch`/`axios` calls inside components.

---

## Task 1: Initialize Vite + base configs

**Files:**
- Create: `client/package.json`, `client/tsconfig.json`, `client/tsconfig.node.json`, `client/vite.config.ts`, `client/index.html`, `client/.env.example`, `client/.env`

- [ ] **Step 1: Scaffold Vite (no template — we write configs by hand)**

Run from repo root:
```bash
mkdir -p client && cd client
```

- [ ] **Step 2: Create `client/package.json`**

```json
{
  "name": "@bugfix/client",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 5173",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@hookform/resolvers": "3.9.1",
    "@tanstack/react-query": "5.62.7",
    "axios": "1.7.9",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "framer-motion": "11.15.0",
    "lucide-react": "0.469.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "7.54.2",
    "react-router-dom": "6.28.0",
    "sonner": "1.7.1",
    "tailwind-merge": "2.5.5",
    "tailwindcss-animate": "1.0.7",
    "zod": "3.24.1",
    "zustand": "5.0.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@testing-library/user-event": "14.5.2",
    "@types/react": "18.3.18",
    "@types/react-dom": "18.3.5",
    "@vitejs/plugin-react": "4.3.4",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.1",
    "jest-axe": "9.0.0",
    "@types/jest-axe": "3.5.9",
    "jsdom": "25.0.1",
    "msw": "2.7.0",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.17",
    "typescript": "5.7.2",
    "vite": "6.0.5",
    "vitest": "2.1.8"
  }
}
```

- [ ] **Step 3: Create `client/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `client/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "tailwind.config.ts"]
}
```

- [ ] **Step 5: Create `client/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173, strictPort: true },
});
```

- [ ] **Step 6: Create `client/index.html`**

```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bug Fix App</title>
    <meta name="theme-color" content="#0a0a0a" />
  </head>
  <body class="min-h-screen bg-base text-primary antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `client/.env.example` + `client/.env`**

```bash
VITE_API_URL=http://localhost:4000
```

- [ ] **Step 8: Install**

Run: `npm install`

- [ ] **Step 9: Commit**

```bash
git add client/package.json client/tsconfig.json client/tsconfig.node.json client/vite.config.ts client/index.html client/.env.example client/package-lock.json
git commit -m "chore(client): scaffold Vite + React + TS"
```

---

## Task 2: Tailwind + design tokens (Field Report theme)

**Files:**
- Create: `client/postcss.config.js`
- Create: `client/tailwind.config.ts`
- Create: `client/src/index.css`
- Create: `client/src/styles/fonts.css`

- [ ] **Step 1: Create `client/postcss.config.js`**

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 2: Create `client/tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border: 'var(--border)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        accent: 'var(--accent)',
        // semantic — also expose as CSS classes for severity/status chips
        sev: {
          low: 'var(--sev-low)',
          med: 'var(--sev-med)',
          high: 'var(--sev-high)',
          critical: 'var(--sev-critical)',
        },
      },
      fontFamily: {
        display: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
        body: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '26px'],
        lg: ['18px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['32px', '40px'],
        '3xl': ['48px', '56px'],
      },
      borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
      ringColor: { DEFAULT: 'var(--accent)' },
    },
  },
  plugins: [animate],
} satisfies Config;
```

- [ ] **Step 3: Create `client/src/styles/fonts.css`**

We use CDN font files (Geist + JetBrains Mono) to avoid font-binary plumbing.

```css
@import url('https://cdn.jsdelivr.net/npm/@fontsource-variable/geist@5.0.3/index.css');
@import url('https://cdn.jsdelivr.net/npm/@fontsource-variable/jetbrains-mono@5.0.20/index.css');
```

- [ ] **Step 4: Create `client/src/index.css`**

```css
@import './styles/fonts.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-base: 9 9 11;            /* zinc-950 */
    --bg-surface: 24 24 27;       /* zinc-900 */
    --bg-elevated: 39 39 42;      /* zinc-800 */
    --border: 39 39 42;           /* zinc-800 */
    --text-primary: 244 244 245;  /* zinc-100 */
    --text-secondary: 161 161 170;/* zinc-400 */
    --text-tertiary: 113 113 122; /* zinc-500 */
    --accent: 251 191 36;         /* amber-400 */
    --sev-low: 52 211 153;        /* emerald-400 */
    --sev-med: 56 189 248;        /* sky-400 */
    --sev-high: 251 191 36;       /* amber-400 */
    --sev-critical: 251 113 133;  /* rose-400 */
  }
  html.light {
    --bg-base: 250 250 250;
    --bg-surface: 255 255 255;
    --bg-elevated: 244 244 245;
    --border: 228 228 231;
    --text-primary: 24 24 27;
    --text-secondary: 82 82 91;
    --text-tertiary: 113 113 122;
    --accent: 217 119 6;          /* amber-600 for AA on light */
    --sev-low: 5 150 105;
    --sev-med: 2 132 199;
    --sev-high: 217 119 6;
    --sev-critical: 225 29 72;
  }
  html, body { background: rgb(var(--bg-base)); color: rgb(var(--text-primary)); }
  body { font-family: theme('fontFamily.body'); }
  /* atmospheric dot grid */
  body::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(rgb(var(--text-tertiary) / 0.10) 1px, transparent 1px);
    background-size: 8px 8px;
    pointer-events: none;
    z-index: 0;
  }
  *:focus-visible {
    outline: 2px solid rgb(var(--accent));
    outline-offset: 2px;
    border-radius: 4px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
}

@layer utilities {
  .bg-base     { background-color: rgb(var(--bg-base)); }
  .bg-surface  { background-color: rgb(var(--bg-surface)); }
  .bg-elevated { background-color: rgb(var(--bg-elevated)); }
  .text-primary   { color: rgb(var(--text-primary)); }
  .text-secondary { color: rgb(var(--text-secondary)); }
  .text-tertiary  { color: rgb(var(--text-tertiary)); }
  .border-default { border-color: rgb(var(--border)); }
  .text-accent { color: rgb(var(--accent)); }
  .bg-accent   { background-color: rgb(var(--accent)); color: rgb(var(--bg-base)); }
}
```

- [ ] **Step 5: Commit**

```bash
git add client/postcss.config.js client/tailwind.config.ts client/src/index.css client/src/styles/fonts.css
git commit -m "feat(client): tailwind + Field Report design tokens"
```

---

## Task 3: shadcn/ui setup + first primitives

**Files:**
- Create: `client/components.json`
- Create: `client/src/lib/utils.ts`
- Generate: button, input, label, card, dialog, dropdown-menu, toast (sonner is used standalone)

- [ ] **Step 1: Create `client/src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create `client/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Install primitives via shadcn CLI**

Run from `client/`:
```bash
npx shadcn@latest add button input label card dialog dropdown-menu skeleton tabs sheet badge tooltip
```

Accept defaults. Files land in `src/components/ui/`.

- [ ] **Step 4: Commit**

```bash
git add client/components.json client/src/lib/utils.ts client/src/components/ui
git commit -m "feat(client): shadcn primitives (button, input, dialog, ...)"
```

---

## Task 4: React Router root + react-query + main.tsx

**Files:**
- Create: `client/src/main.tsx`
- Create: `client/src/App.tsx`
- Create: `client/src/lib/query-client.ts`
- Create: `client/src/lib/api.ts`
- Create: `client/src/types/domain.ts`
- Create: `client/src/components/common/ThemedToaster.tsx`

- [ ] **Step 1: `client/src/lib/api.ts`**

```ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'X-Requested-With': 'fetch' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // normalize: err.response?.data?.error → { code, message, details? }
    return Promise.reject(err);
  },
);
```

- [ ] **Step 2: `client/src/lib/query-client.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
```

- [ ] **Step 3: `client/src/types/domain.ts`**

```ts
export type Role = 'ADMIN' | 'DEVELOPER' | 'TESTER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type BugStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  priority: Priority | null;
  status: BugStatus;
  screenshots: string[];
  reporterId: string;
  assigneeId: string | null;
  reporter?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Comment {
  id: string;
  bugId: string;
  authorId: string;
  text: string;
  author?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
```

- [ ] **Step 4: `client/src/components/common/ThemedToaster.tsx`**

```tsx
import { Toaster } from 'sonner';

export function ThemedToaster() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      richColors
      closeButton
      toastOptions={{ duration: 4000 }}
    />
  );
}
```

- [ ] **Step 5: `client/src/App.tsx`** (placeholder routes — pages added in later tasks)

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

function Placeholder({ label }: { label: string }) {
  return <div className="p-8 text-secondary">{label}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Placeholder label="login (todo)" />} />
        <Route path="/register" element={<Placeholder label="register (todo)" />} />
        <Route path="/dashboard" element={<Placeholder label="dashboard (todo)" />} />
        <Route path="/profile" element={<Placeholder label="profile (todo)" />} />
        <Route path="*" element={<Placeholder label="not found" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: `client/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/query-client';
import { ThemedToaster } from './components/common/ThemedToaster';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ThemedToaster />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 7: Run dev server and verify boot**

Run: `cd client && npm run dev`
Visit `http://localhost:5173/login` → see "login (todo)" with dark Field Report background. Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add client/src
git commit -m "feat(client): router + react-query + axios + types + toaster"
```

---

## Task 5: Vitest + MSW + test setup

**Files:**
- Create: `client/vitest.config.ts`
- Create: `client/src/tests/setup.ts`
- Create: `client/src/tests/msw/handlers.ts`
- Create: `client/src/tests/msw/server.ts`

- [ ] **Step 1: Create `client/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 2: Create `client/src/tests/msw/handlers.ts`**

```ts
import { http, HttpResponse } from 'msw';
import type { User } from '@/types/domain';

const TEST_USER: User = {
  id: 'u1',
  email: 'jane@example.com',
  name: 'Jane',
  role: 'TESTER',
  createdAt: new Date().toISOString(),
};

export const baseHandlers = [
  http.post('http://localhost:4000/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string };
    if (body.email === 'taken@example.com') {
      return HttpResponse.json(
        { error: { code: 'CONFLICT', message: 'Email already registered' } },
        { status: 409 },
      );
    }
    return HttpResponse.json({ user: { ...TEST_USER, email: body.email } }, { status: 201 });
  }),

  http.post('http://localhost:4000/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.password !== 'Passw0rd!') {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
        { status: 401 },
      );
    }
    return HttpResponse.json({ user: { ...TEST_USER, email: body.email } });
  }),

  http.get('http://localhost:4000/api/auth/me', () => HttpResponse.json({ user: TEST_USER })),
  http.post('http://localhost:4000/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
];
```

- [ ] **Step 3: Create `client/src/tests/msw/server.ts`**

```ts
import { setupServer } from 'msw/node';
import { baseHandlers } from './handlers';

export const server = setupServer(...baseHandlers);
```

- [ ] **Step 4: Create `client/src/tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 5: Verify Vitest boots**

Run: `cd client && npm test -- --run`
Expected: "No test files found" exit 0.

- [ ] **Step 6: Commit**

```bash
git add client/vitest.config.ts client/src/tests
git commit -m "test(client): vitest + MSW infra"
```

---

## Task 6: Auth API client + zustand store + useAuth hook

**Files:**
- Create: `client/src/stores/auth.ts`
- Create: `client/src/hooks/use-auth.ts`

- [ ] **Step 1: Create `client/src/stores/auth.ts`**

```ts
import { create } from 'zustand';
import type { User } from '@/types/domain';

interface AuthState {
  user: User | null;
  status: 'unknown' | 'authed' | 'guest';
  setUser: (u: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'unknown',
  setUser: (u) => set({ user: u, status: u ? 'authed' : 'guest' }),
}));
```

- [ ] **Step 2: Create `client/src/hooks/use-auth.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { User } from '@/types/domain';

const ME_KEY = ['auth', 'me'] as const;

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get<{ user: User }>('/api/auth/me');
        setUser(data.user);
        return data.user;
      } catch (e) {
        setUser(null);
        throw e;
      }
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<{ user: User }>('/api/auth/login', input);
      return data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      const { data } = await api.post<{ user: User }>('/api/auth/register', input);
      return data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      qc.setQueryData(ME_KEY, null);
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/stores client/src/hooks/use-auth.ts
git commit -m "feat(client): auth store + react-query hooks"
```

---

## Task 7: AuthGuard + RoleGuard (TDD)

**Files:**
- Create: `client/src/components/auth/AuthGuard.tsx`
- Create: `client/src/components/auth/RoleGuard.tsx`
- Create: `client/src/pages/ForbiddenPage.tsx`
- Create: `client/src/tests/components/AuthGuard.test.tsx`

- [ ] **Step 1: Write failing test `tests/components/AuthGuard.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/msw/server';
import { AuthGuard } from '@/components/auth/AuthGuard';

function renderWith(initialPath: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>login screen</div>} />
          <Route
            path="/protected"
            element={
              <AuthGuard>
                <div>secret content</div>
              </AuthGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AuthGuard', () => {
  it('renders children when authenticated', async () => {
    renderWith('/protected');
    await waitFor(() => expect(screen.getByText('secret content')).toBeInTheDocument());
  });

  it('redirects to /login when 401', async () => {
    server.use(
      http.get('http://localhost:4000/api/auth/me', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'no auth' } },
          { status: 401 },
        ),
      ),
    );
    renderWith('/protected');
    await waitFor(() => expect(screen.getByText('login screen')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `cd client && npm test -- --run AuthGuard`

- [ ] **Step 3: Write `AuthGuard.tsx`**

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useMe } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: PropsWithChildren) {
  const me = useMe();
  const loc = useLocation();
  if (me.isLoading) {
    return (
      <div className="p-8" aria-live="polite">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }
  if (me.isError || !me.data) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 4: Write `RoleGuard.tsx`**

```tsx
import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '@/types/domain';
import { useMe } from '@/hooks/use-auth';

export function RoleGuard({ allow, children }: PropsWithChildren<{ allow: Role[] }>) {
  const me = useMe();
  if (me.isLoading) return null;
  if (!me.data) return <Navigate to="/login" replace />;
  if (!allow.includes(me.data.role)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 5: Write `ForbiddenPage.tsx`**

```tsx
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-display text-2xl mb-2">403 — Forbidden</h1>
      <p className="text-secondary mb-6">You don't have permission to view this page.</p>
      <Link to="/dashboard" className="text-accent underline">
        Back to dashboard
      </Link>
    </main>
  );
}
```

- [ ] **Step 6: Run tests, expect PASS**

Run: `npm test -- --run AuthGuard`

- [ ] **Step 7: Commit**

```bash
git add client/src/components/auth client/src/pages/ForbiddenPage.tsx client/src/tests/components
git commit -m "feat(client): AuthGuard + RoleGuard + 403 page"
```

---

## Task 8: AppShell — TopBar + SideNav + BottomNav

**Files:**
- Create: `client/src/components/shell/AppShell.tsx`
- Create: `client/src/components/shell/TopBar.tsx`
- Create: `client/src/components/shell/SideNav.tsx`
- Create: `client/src/components/shell/BottomNav.tsx`
- Create: `client/src/components/common/SkipLink.tsx`

- [ ] **Step 1: `SkipLink.tsx`**

```tsx
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-accent focus:text-base focus:px-3 focus:py-2 focus:rounded-md focus:font-display"
    >
      Skip to main content
    </a>
  );
}
```

- [ ] **Step 2: `TopBar.tsx`**

```tsx
import { Bug, LogOut, Search, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/hooks/use-auth';

export function TopBar({ onSearch }: { onSearch?: () => void }) {
  const me = useMe();
  const logout = useLogout();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-default bg-surface/80 backdrop-blur">
      <div className="flex h-full items-center gap-3 px-4">
        <Bug className="h-5 w-5 text-accent" aria-hidden />
        <span className="font-display text-base">Field Report</span>
        <button
          type="button"
          onClick={onSearch}
          className="ml-auto flex h-9 items-center gap-2 rounded-md border border-default bg-base px-3 text-sm text-secondary hover:text-primary"
          aria-label="Search bugs"
        >
          <Search className="h-4 w-4" aria-hidden /> Search <kbd className="ml-2 text-xs">⌘K</kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Profile"
          onClick={() => nav('/profile')}
        >
          <UserIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={async () => {
            await logout.mutateAsync();
            nav('/login');
          }}
          disabled={!me.data}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: `SideNav.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bug, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/use-auth';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'all' as const },
  { to: '/bugs', label: 'Bugs', icon: Bug, role: 'all' as const },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, role: 'admin' as const },
  { to: '/users', label: 'Users', icon: Users, role: 'admin' as const },
];

export function SideNav() {
  const me = useMe();
  const isAdmin = me.data?.role === 'ADMIN';
  return (
    <nav
      aria-label="Primary"
      className="hidden md:flex w-60 shrink-0 flex-col border-r border-default bg-surface"
    >
      <ul className="flex flex-col gap-1 p-3">
        {items
          .filter((i) => i.role !== 'admin' || isAdmin)
          .map((i) => (
            <li key={i.to}>
              <NavLink
                to={i.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-display',
                    'min-h-[44px]',
                    isActive
                      ? 'bg-elevated text-primary'
                      : 'text-secondary hover:bg-elevated hover:text-primary',
                  )
                }
              >
                <i.icon className="h-4 w-4" aria-hidden /> {i.label}
              </NavLink>
            </li>
          ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: `BottomNav.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bug, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/bugs', label: 'Bugs', icon: Bug },
  { to: '/bugs/new', label: 'New', icon: Plus },
  { to: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary mobile"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-default bg-surface/95 backdrop-blur"
    >
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 py-2 text-[11px] min-h-[56px]',
              isActive ? 'text-accent' : 'text-secondary',
            )
          }
        >
          <i.icon className="h-5 w-5" aria-hidden />
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: `AppShell.tsx`**

```tsx
import type { PropsWithChildren } from 'react';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
import { SkipLink } from '@/components/common/SkipLink';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <TopBar />
      <div className="flex flex-1">
        <SideNav />
        <main id="main" className="relative flex-1 px-4 md:px-8 py-6 pb-20 md:pb-6 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add client/src/components/shell client/src/components/common/SkipLink.tsx
git commit -m "feat(client): AppShell + TopBar + SideNav + BottomNav"
```

---

## Task 9: LoginPage (TDD with MSW)

**Files:**
- Create: `client/src/components/auth/LoginForm.tsx`
- Create: `client/src/pages/LoginPage.tsx`
- Modify: `client/src/App.tsx`
- Create: `client/src/tests/pages/LoginPage.test.tsx`

- [ ] **Step 1: Write failing test `tests/pages/LoginPage.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { axe } from 'jest-axe';
import { server } from '@/tests/msw/server';
import { LoginPage } from '@/pages/LoginPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>dashboard ok</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  it('logs in and navigates to /dashboard', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText('dashboard ok')).toBeInTheDocument());
  });

  it('shows server error on bad creds', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i));
  });

  it('shows network error toast on 5xx', async () => {
    server.use(
      http.post('http://localhost:4000/api/auth/login', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'boom' } }, { status: 500 }),
      ),
    );
    renderPage();
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i));
  });

  it('passes a11y smoke', async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Write `LoginForm.tsx`**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormVals = z.infer<typeof schema>;

export function LoginForm() {
  const login = useLogin();
  const nav = useNavigate();
  const loc = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm<FormVals>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (vals) => {
    setServerError(null);
    try {
      await login.mutateAsync(vals);
      const dest = (loc.state as { from?: string })?.from ?? '/dashboard';
      nav(dest, { replace: true });
    } catch (e: unknown) {
      const code = (e as { response?: { data?: { error?: { code?: string; message?: string } } } })
        .response?.data?.error;
      if (code?.code === 'UNAUTHORIZED') setServerError('Invalid credentials');
      else setServerError('Something went wrong. Try again.');
      setFocus('email');
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p role="alert" className="text-xs text-sev-critical">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p role="alert" className="text-xs text-sev-critical">
            {errors.password.message}
          </p>
        )}
      </div>
      {serverError && (
        <p role="alert" className="rounded-md bg-elevated px-3 py-2 text-sm text-sev-critical">
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
      <p className="text-xs text-secondary">
        New here?{' '}
        <Link to="/register" className="text-accent underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Write `LoginPage.tsx`**

```tsx
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-default bg-surface p-8">
        <h1 className="font-display text-xl mb-1">Sign in</h1>
        <p className="text-secondary text-sm mb-6">Field Report — bug tracker</p>
        <LoginForm />
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Mount in `App.tsx`** — replace placeholder

```tsx
import { LoginPage } from '@/pages/LoginPage';
// ...
<Route path="/login" element={<LoginPage />} />
```

- [ ] **Step 6: Run, expect PASS**

Run: `cd client && npm test -- --run LoginPage`

- [ ] **Step 7: Commit**

```bash
git add client/src/components/auth/LoginForm.tsx client/src/pages/LoginPage.tsx client/src/App.tsx client/src/tests/pages/LoginPage.test.tsx
git commit -m "feat(client): login page with TDD + a11y check"
```

---

## Task 10: RegisterPage (TDD with MSW)

**Files:**
- Create: `client/src/components/auth/RegisterForm.tsx`
- Create: `client/src/pages/RegisterPage.tsx`
- Modify: `client/src/App.tsx`
- Create: `client/src/tests/pages/RegisterPage.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';
import { RegisterPage } from '@/pages/RegisterPage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<div>dashboard ok</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RegisterPage', () => {
  it('registers and navigates', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText('dashboard ok')).toBeInTheDocument());
  });

  it('shows conflict error', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/already registered/i));
  });

  it('rejects weak password client-side', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');
    await userEvent.tab();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('a11y smoke', async () => {
    const { container } = renderPage();
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Write `RegisterForm.tsx`**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(80),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain a letter')
    .regex(/[0-9]/, 'Must contain a number'),
});
type Vals = z.infer<typeof schema>;

export function RegisterForm() {
  const reg = useRegister();
  const nav = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Vals>({ resolver: zodResolver(schema), mode: 'onBlur' });

  const onSubmit = handleSubmit(async (vals) => {
    setServerError(null);
    try {
      await reg.mutateAsync(vals);
      nav('/dashboard', { replace: true });
    } catch (e: unknown) {
      const err = (e as { response?: { data?: { error?: { code: string; message: string } } } })
        .response?.data?.error;
      setServerError(err?.code === 'CONFLICT' ? 'Email already registered' : 'Something went wrong');
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
        {errors.name && <p role="alert" className="text-xs text-sev-critical">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        {errors.email && <p role="alert" className="text-xs text-sev-critical">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p role="alert" className="text-xs text-sev-critical">{errors.password.message}</p>
        )}
      </div>
      {serverError && (
        <p role="alert" className="rounded-md bg-elevated px-3 py-2 text-sm text-sev-critical">
          {serverError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create account'}
      </Button>
      <p className="text-xs text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-accent underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Write `RegisterPage.tsx`** + mount route

```tsx
// client/src/pages/RegisterPage.tsx
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-default bg-surface p-8">
        <h1 className="font-display text-xl mb-1">Create account</h1>
        <p className="text-secondary text-sm mb-6">Join Field Report</p>
        <RegisterForm />
      </section>
    </main>
  );
}
```

In `App.tsx`:
```tsx
import { RegisterPage } from '@/pages/RegisterPage';
<Route path="/register" element={<RegisterPage />} />
```

- [ ] **Step 5: Run, expect PASS**

Run: `npm test -- --run RegisterPage`

- [ ] **Step 6: Commit**

```bash
git add client/src/components/auth/RegisterForm.tsx client/src/pages/RegisterPage.tsx client/src/App.tsx client/src/tests/pages/RegisterPage.test.tsx
git commit -m "feat(client): register page with TDD"
```

---

## Task 11: ProfilePage (basic, behind AuthGuard) + AppShell wiring

**Files:**
- Create: `client/src/pages/ProfilePage.tsx`
- Create: `client/src/pages/NotFoundPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: `NotFoundPage.tsx`**

```tsx
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-display text-2xl mb-2">404 — Not found</h1>
      <Link to="/dashboard" className="text-accent underline">Back to dashboard</Link>
    </main>
  );
}
```

- [ ] **Step 2: `ProfilePage.tsx`**

```tsx
import { useMe } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfilePage() {
  const me = useMe();
  if (!me.data) return null;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Profile</h1>
      <Card className="bg-surface border-default">
        <CardHeader>
          <CardTitle className="font-display text-base">{me.data.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-secondary text-sm space-y-1">
          <p>{me.data.email}</p>
          <p className="font-mono text-xs">role: {me.data.role}</p>
          <p className="font-mono text-xs">id: {me.data.id}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Update `App.tsx` to compose AppShell + guards**

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AppShell } from '@/components/shell/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';

function Authed({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route
          path="/profile"
          element={
            <Authed>
              <ProfilePage />
            </Authed>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Authed>
              <div className="text-secondary">Dashboard placeholder (Plan 5)</div>
            </Authed>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Manual smoke**

Run: `npm run dev` (server also running). Register a new user → see Profile after redirect → Sign out → redirect to /login. Confirm dot-grid, fonts, focus rings.

- [ ] **Step 5: Commit**

```bash
git add client/src
git commit -m "feat(client): profile + 404 + shell wiring"
```

---

## Task 12: Extend CI to include the client

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Append a `client` job**

```yaml
  client:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: client
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: client/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --run
      - run: npm run build
```

- [ ] **Step 2: Push branch + verify CI green**

```bash
git checkout -b plan-4-client-shell-auth
git push -u origin plan-4-client-shell-auth
```
Open PR. Confirm both `server` and `client` jobs are green.

- [ ] **Step 3: Commit (workflow update)**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add client lint/typecheck/test/build job"
```

---

## Done — Plan 4 acceptance

- [ ] `npm run dev` (client) loads `/login` with Field Report theme (dot grid, mono headings, amber focus ring)
- [ ] Register against the live server → cookie set → redirected to `/dashboard` placeholder
- [ ] Sign out clears cookie + redirects to `/login`
- [ ] AuthGuard redirects unauthenticated users away from `/profile` and `/dashboard`
- [ ] All client tests green (LoginPage, RegisterPage, AuthGuard, a11y smoke)
- [ ] CI green for both server and client jobs
