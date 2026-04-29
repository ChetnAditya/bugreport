// Re-exported from shared — the client consumes these as its source of truth.
// Keeping a local copy avoids a monorepo package dep for now.
export type Role = 'ADMIN' | 'DEVELOPER' | 'TESTER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type BugStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED';

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
