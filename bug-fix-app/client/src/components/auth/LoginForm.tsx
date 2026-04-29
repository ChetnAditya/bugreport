import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
