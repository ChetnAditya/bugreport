import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-display text-2xl mb-2">403 — Forbidden</h1>
      <p className="text-secondary mb-6">You don&apos;t have permission to view this page.</p>
      <Link to="/dashboard" className="text-accent underline">
        Back to dashboard
      </Link>
    </main>
  );
}
