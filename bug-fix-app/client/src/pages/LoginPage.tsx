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
