// Source of truth for ALL domain types consumed by client and server.
// If server schemas change, update here first.

export const SEVERITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const PRIORITY = ['P1', 'P2', 'P3', 'P4'] as const;
export const STATUS = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'] as const;
export const ROLE = ['ADMIN', 'DEVELOPER', 'TESTER'] as const;

export type Role = (typeof ROLE)[number];
export type Severity = (typeof SEVERITY)[number];
export type Priority = (typeof PRIORITY)[number];
export type BugStatus = (typeof STATUS)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  priority: Priority | null;
  status: BugStatus;
  screenshots: string[];
  reporterId: string;
  assigneeId: string | null;
  reporter?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Comment {
  id: string;
  bugId: string;
  authorId: string;
  text: string;
  author?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

// Auth payload shapes
export interface RegisterInput { name: string; email: string; password: string }
export interface LoginInput { email: string; password: string }

// Bug query/mutation shapes
export interface ListBugsQuery {
  status?: BugStatus;
  severity?: Severity;
  priority?: Priority;
  assigneeId?: string;
  q?: string;
  page?: number;
  limit?: number;
}
export interface CreateBugInput {
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  screenshots?: string[];
}
export interface UpdateBugInput {
  title?: string;
  description?: string;
  stepsToReproduce?: string;
}
export interface TransitionInput {
  to: BugStatus;
  assigneeId?: string;
  priority?: Priority;
}
