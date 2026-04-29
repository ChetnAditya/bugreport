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
