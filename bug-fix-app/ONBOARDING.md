# BugFix — Onboarding Guide

## Overview

BugFix is a team-based bug tracking system with role-based permissions. Every user belongs to a **Team** (except Superadmins). Bugs are scoped to teams and flow through a lifecycle: `NEW → ASSIGNED → IN_PROGRESS → FIXED → VERIFIED → CLOSED`.

---

## User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **SUPERADMIN** | Platform administrator | Create/delete teams, change any user's role, close any bug, manage all bugs across teams |
| **TEAMLEAD** | Team manager | Verify and close bugs within own team, assign/manage team members, create bugs |
| **DEVELOPER** | Bug fixer | Start work on assigned bugs, mark bugs as fixed, view own team's bugs |
| **TESTER** | Bug reporter | Report new bugs, verify fixed bugs, view own team's bugs |

---

## Getting Started — First Time Setup

### Step 1: Create Teams

Only **SUPERADMIN** can create teams.

1. Login as `superadmin@bugfix.local` (password: `SuperAdmin123`)
2. Go to **Teams** page (`/teams`)
3. Click **New team** button
4. Enter team name and description
5. Click **Create team**

```
Example teams:
- Alpha Squad (Frontend team)
- Beta Squad (Backend team)
- Gamma Squad (QA team)
```

### Step 2: Assign Team Leads

Team leads must be created as regular users first, then assigned to teams.

#### Option A: Create team lead during user assignment

1. Go to **Users** page (`/users`)
2. Find the user you want to make a team lead (or create a new user)
3. Click the **role change** button on that user's row
4. Set role to **TEAMLEAD**
5. Then go to **Teams** → select the team → add the user as a member

#### Option B: From Teams page

1. Go to **Teams** page (`/teams`)
2. Click on a team to open team detail
3. Use the team member management to assign users

**Note:** Team leads can only manage users within their own team.

### Step 3: Assign Developers and Testers

1. Go to **Users** page (`/users`)
2. Find each user
3. Update their **Team** assignment (dropdown or team field)
4. Set their **Role** appropriately:
   - `DEVELOPER` for developers
   - `TESTER` for QA/testers

### Step 4: Set Reporting Structure (Optional)

Each user can have a **Direct Manager** set:
1. Go to **Users** page
2. Click on a user
3. Assign their **Reports to** field

This creates an org chart hierarchy.

---

## Test Accounts (Development)

| Role | Email | Password | Team |
|------|-------|----------|------|
| SUPERADMIN | superadmin@bugfix.local | SuperAdmin123 | None (all-access) |
| TEAMLEAD | alice.lead@bugfix.local | Lead12345 | Alpha Squad |
| TEAMLEAD | bob.lead@bugfix.local | Lead12345 | Beta Squad |
| DEVELOPER | carol.dev@bugfix.local | Dev12345 | Alpha Squad |
| DEVELOPER | dave.dev@bugfix.local | Dev12345 | Beta Squad |
| TESTER | ellen.test@bugfix.local | Test1234 | Alpha Squad |
| TESTER | fred.test@bugfix.local | Test1234 | Beta Squad |

---

## Role Permissions Matrix

### Bug Lifecycle

| Action | SUPERADMIN | TEAMLEAD | DEVELOPER | TESTER |
|--------|------------|----------|-----------|--------|
| Create bug | Yes (any team) | Yes (own team) | No | Yes (own team) |
| Assign bug (NEW → ASSIGNED) | Yes | No | No | No |
| Start work (ASSIGNED → IN_PROGRESS) | Yes | No | Assignee only | No |
| Mark fixed (IN_PROGRESS → FIXED) | Yes | No | Assignee only | No |
| Verify fix (FIXED → VERIFIED) | Yes | Own team | No | Own team |
| Reject fix (FIXED → IN_PROGRESS) | Yes | Own team | No | Own team |
| Close bug (VERIFIED → CLOSED) | Yes | Own team | No | No |

### Team Management

| Action | SUPERADMIN | TEAMLEAD | DEVELOPER | TESTER |
|--------|------------|----------|-----------|--------|
| Create team | Yes | No | No | No |
| Delete team | Yes (empty only) | No | No | No |
| Assign user to team | Yes | Own team only | No | No |
| Change user role | Yes | No | No | No |
| Set direct manager | Yes | Own team only | No | No |

---

## Workflow — Reporting and Closing a Bug

### For Testers: Report a Bug

1. Login as a **TESTER** (e.g., `ellen.test@bugfix.local`)
2. Go to **Bugs** page → Click **New bug**
3. Fill in:
   - **Title**: Short, descriptive name
   - **Description**: Full details of the bug
   - **Severity**: LOW / MEDIUM / HIGH / CRITICAL
   - **Steps to Reproduce**: How to recreate the bug
   - **Screenshots**: Optional evidence
4. Submit → Bug appears in `NEW` status

### For Team Leads: Assign a Bug

1. Login as **TEAMLEAD**
2. Go to **Bugs** → Find `NEW` bugs in your team
3. Click on the bug
4. Click **Change status** → Select **Assign...**
5. Pick a **Developer** from your team as assignee
6. Pick a **Priority** (P1–P4)
7. Confirm → Bug moves to `ASSIGNED`

### For Developers: Work the Bug

1. Login as **DEVELOPER** assigned to the bug
2. Go to **Bugs** → Find `ASSIGNED` bugs
3. Click on your bug
4. Click **Change status** → **Start work**
5. Bug moves to `IN_PROGRESS`
6. Fix the bug
7. Click **Change status** → **Mark fixed**
8. Bug moves to `FIXED`

### For Testers: Verify the Fix

1. Login as **TESTER**
2. Go to **Bugs** → Find `FIXED` bugs
3. Test the fix
4. If fixed: Click **Change status** → **Verify fix** → Bug moves to `VERIFIED`
5. If not fixed: Click **Change status** → **Reject (back to dev)** → Bug moves back to `IN_PROGRESS`

### For Team Leads: Close the Bug

1. Login as **TEAMLEAD**
2. Go to **Bugs** → Find `VERIFIED` bugs
3. Review the fix
4. Click **Change status** → **Close**
5. Bug moves to `CLOSED` with a timestamp

---

## Team Management Guide

### Creating a New Team

**Who:** SUPERADMIN only

1. Go to `/teams`
2. Click **New team**
3. Enter name and description
4. Click **Create team**

### Adding Members to a Team

**Who:** SUPERADMIN (any team) or TEAMLEAD (own team)

1. Go to `/teams`
2. Click on the team
3. Find the user in `/users`
4. Edit their team assignment

### Changing a User's Role

**Who:** SUPERADMIN only

1. Go to `/users`
2. Click the role button on the user's row
3. Select new role
4. Confirm

**Important:** Only SUPERADMIN can change roles. TEAMLEAD cannot promote users.

### Deleting a Team

**Who:** SUPERADMIN only

**Prerequisites:** Team must have no members and no bugs.

1. Go to `/teams`
2. Click the trash icon on the team
3. Confirm deletion

If the team has members or bugs, you must reassign them first.

---

## Common Tasks

### Reassign a Bug to a Different Developer

1. Open the bug
2. Click **Change status**
3. Select **Assign...**
4. Choose a different developer from your team
5. Set priority
6. Confirm

### Reject a Fix (Send Back to Developer)

1. Open a `FIXED` bug as TESTER or TEAMLEAD
2. Click **Change status**
3. Select **Reject (back to dev)**
4. Bug returns to `IN_PROGRESS` for the developer to fix again

### View Bugs by Team

1. Go to **Bugs** page
2. Use the filter bar to filter by team
3. Or navigate to `/teams/{team_id}` to see team-specific bugs

### Check Org Chart

1. Go to **Org Chart** page (`/org`)
2. See the hierarchy of managers and their direct reports

---

## Bug Status Reference

| Status | Who can transition TO this | Who can transition FROM this |
|--------|----------------------------|------------------------------|
| **NEW** | SUPERADMIN (via Assign) | ASSIGNED (rejected) |
| **ASSIGNED** | SUPERADMIN only | IN_PROGRESS (dev starts) |
| **IN_PROGRESS** | Developer (assignee) | FIXED (dev marks done), NEW (rejected) |
| **FIXED** | Developer (assignee) | VERIFIED (tester approves), IN_PROGRESS (tester rejects) |
| **VERIFIED** | TESTER, TEAMLEAD, SUPERADMIN | CLOSED (team lead or admin) |
| **CLOSED** | TEAMLEAD, SUPERADMIN | None (terminal state) |

---

## Troubleshooting

### "Change status" button not visible
- Check your role in the top nav
- Only TEAMLEAD, TESTER, and SUPERADMIN see it
- DEVELOPER role does NOT see this button on bugs not assigned to them

### Cannot create bug
- Only TESTER, TEAMLEAD, and SUPERADMIN can create bugs
- DEVELOPER cannot report bugs — they only work on assigned bugs

### Cannot close a bug
- Only TEAMLEAD and SUPERADMIN can close bugs
- Bug must be in `VERIFIED` status first
- TEAMLEAD can only close bugs in their own team

### Cannot assign user to team
- TEAMLEAD can only assign users to their own team
- SUPERADMIN can assign to any team

### Team won't delete
- Team must have zero members
- Team must have zero bugs
- Remove all members and bugs first

---

## URLs Reference

| Page | URL |
|------|-----|
| Login | `/login` |
| Bug List | `/bugs` |
| Report Bug | `/bugs/new` |
| Teams | `/teams` |
| Team Detail | `/teams/{id}` |
| Users | `/users` |
| Org Chart | `/org-chart` |
| Dashboard | `/` (home) |