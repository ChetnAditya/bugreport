import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import type { Role } from '@/types/domain';
import { useMe } from '@/hooks/use-auth';

export function RoleGuard({ allow, children }: PropsWithChildren<{ allow: Role[] }>) {
  const me = useMe();
  if (me.isLoading) return null;
  if (!me.data) return <Navigate to="/login" replace />;
  // SUPERADMIN supersedes ADMIN for backward compat
  const userRole = me.data.role as Role;
  if (userRole === 'SUPERADMIN') return <>{children}</>;
  if (!allow.includes(userRole)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}
