import { z } from 'zod';

export const listUsersQuery = z.object({
  role: z.enum(['ADMIN', 'DEVELOPER', 'TESTER']).optional(),
});

export const changeRoleBody = z.object({
  role: z.enum(['ADMIN', 'DEVELOPER', 'TESTER']),
});
