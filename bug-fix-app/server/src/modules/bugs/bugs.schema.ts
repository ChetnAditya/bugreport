import { z } from 'zod';

export const SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const PRIORITY = ['P1', 'P2', 'P3', 'P4'] as const;
export const STATUS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'] as const;

export const createBugSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  stepsToReproduce: z.string().min(5).max(2000),
  severity: z.enum(SEVERITY),
  screenshots: z.array(z.string().url()).max(5).optional(),
});

export const updateBugSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  description: z.string().min(10).max(5000).optional(),
  stepsToReproduce: z.string().min(5).max(2000).optional(),
});

export const transitionSchema = z.object({
  to: z.enum(STATUS),
  assigneeId: z.string().cuid().optional(),
  priority: z.enum(PRIORITY).optional(),
});

export const listBugsQuery = z.object({
  status: z.enum(STATUS).optional(),
  severity: z.enum(SEVERITY).optional(),
  priority: z.enum(PRIORITY).optional(),
  assigneeId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  q: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const cloudinaryUrl = z
  .string()
  .url()
  .refine((u) => /^https:\/\/res\.cloudinary\.com\//.test(u), 'Must be a Cloudinary URL');

export const addScreenshotsSchema = z.object({
  urls: z.array(cloudinaryUrl).min(1).max(5),
});

export type CreateBugInput = z.infer<typeof createBugSchema>;
export type UpdateBugInput = z.infer<typeof updateBugSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;
export type ListBugsQuery = z.infer<typeof listBugsQuery>;
