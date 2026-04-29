import { z } from 'zod';

export const listUsersQuery = z.object({
  role: z.enum(['SUPERADMIN', 'TEAMLEAD', 'DEVELOPER', 'TESTER']).optional(),
  teamId: z.string().optional(),
});

export const changeRoleBody = z.object({
  role: z.enum(['SUPERADMIN', 'TEAMLEAD', 'DEVELOPER', 'TESTER']),
});
