import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-display text-2xl mb-2">404 — Not found</h1>
      <Link to="/dashboard" className="text-accent underline">
        Back to dashboard
      </Link>
    </main>
  );
}
