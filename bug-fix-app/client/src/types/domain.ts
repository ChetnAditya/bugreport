// Re-exported from shared — the client consumes these as its source of truth.
export type Role = 'SUPERADMIN' | 'TEAMLEAD' | 'DEVELOPER' | 'TESTER';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type BugStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'FIXED' | 'VERIFIED' | 'CLOSED';

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  teamId: string | null;
  directManagerId: string | null;
  team?: Pick<Team, 'id' | 'name' | 'slug'> | null;
  directManager?: Pick<User, 'id' | 'name' | 'email'> | null;
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
  teamId: string | null;
  reporter?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
  team?: Pick<Team, 'id' | 'name'> | null;
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
