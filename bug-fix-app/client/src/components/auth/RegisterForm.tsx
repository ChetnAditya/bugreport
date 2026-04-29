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
        {errors.name && (
          <p role="alert" className="text-xs text-sev-critical">
            {errors.name.message}
          </p>
        )}
      </div>
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
          autoComplete="new-password"
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
