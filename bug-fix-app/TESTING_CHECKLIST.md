# Bug Lifecycle + Permissions — Testing Checklist

## Test Accounts

| Role | Email | Password | Team |
|------|-------|----------|------|
| SUPERADMIN | superadmin@bugfix.local | SuperAdmin123 | — |
| TEAMLEAD | lead.alpha@bugfix.local | Lead12345 | Alpha |
| TEAMLEAD | lead.beta@bugfix.local | Lead12345 | Beta |
| DEVELOPER | dev1@bugfix.local | Dev12345 | Alpha |
| DEVELOPER | dev2@bugfix.local | Dev12345 | Beta |
| TESTER | tester1@bugfix.local | Test1234 | Alpha |
| TESTER | tester2@bugfix.local | Test1234 | Beta |

---

## 1. Lifecycle Transitions (Frontend + Backend)

| # | Action | Actor | Expected Result |
|---|--------|-------|-----------------|
| 1.1 | NEW → ASSIGNED | SUPERADMIN only | Button visible, success |
| 1.2 | NEW → ASSIGNED | TEAMLEAD | Button hidden (403 on API) |
| 1.3 | ASSIGNED → IN_PROGRESS | Assignee DEV | Button visible to assignee only |
| 1.4 | ASSIGNED → IN_PROGRESS | DEV (not assignee) | Button hidden |
| 1.5 | IN_PROGRESS → FIXED | Assignee DEV | Button visible to assignee only |
| 1.6 | IN_PROGRESS → FIXED | DEV (not assignee) | Button hidden |
| 1.7 | FIXED → VERIFIED | TESTER | Button visible |
| 1.8 | FIXED → VERIFIED | TEAMLEAD | Button visible |
| 1.9 | FIXED → VERIFIED | SUPERADMIN | Button visible |
| 1.10 | FIXED → IN_PROGRESS (reject) | TESTER | Button visible |
| 1.11 | FIXED → IN_PROGRESS (reject) | TEAMLEAD | Button visible |
| 1.12 | VERIFIED → CLOSED | TEAMLEAD | Button visible |
| 1.13 | VERIFIED → CLOSED | SUPERADMIN | Button visible |
| 1.14 | VERIFIED → CLOSED | TESTER | Button hidden (403 on API) |
| 1.15 | VERIFIED → CLOSED | DEVELOPER | Button hidden |

---

## 2. Superadmin Team Management

| # | Action | Expected |
|---|--------|----------|
| 2.1 | Login as SUPERADMIN → create team | 201 created |
| 2.2 | Login as SUPERADMIN → assign TEAMLEAD to team | 200 ok |
| 2.3 | Login as SUPERADMIN → reassign TEAMLEAD to different team | 200 ok |
| 2.4 | Login as TEAMLEAD → create team | 403 forbidden |
| 2.5 | Login as TEAMLEAD → assign user to own team | 200 ok |
| 2.6 | Login as TEAMLEAD → assign user to different team | 403 forbidden |
| 2.7 | Login as TEAMLEAD → change user role | 403 forbidden |
| 2.8 | Login as SUPERADMIN → change user role | 200 ok |
| 2.9 | Login as SUPERADMIN → delete empty team | 204 ok |
| 2.10 | Login as SUPERADMIN → delete team with members | 400 bad request |
| 2.11 | Login as SUPERADMIN → delete team with bugs | 400 bad request |

---

## 3. Team-Scoped Assignee Filtering

| # | Action | Expected |
|---|--------|----------|
| 3.1 | TEAMLEAD Alpha opens TransitionMenu → assignee dropdown | Only Alpha team devs shown |
| 3.2 | TEAMLEAD Beta opens TransitionMenu → assignee dropdown | Only Beta team devs shown |
| 3.3 | SUPERADMIN opens TransitionMenu → assignee dropdown | All devs shown (no filter) |

---

## 4. BugMetaPanel Display

| # | Check | Expected |
|---|-------|----------|
| 4.1 | BugMetaPanel shows team name | Team name visible |
| 4.2 | BugMetaPanel shows reporter | Reporter name visible |
| 4.3 | BugMetaPanel shows assignee | Assignee name or "Unassigned" |

---

## 5. Edge Cases

| # | Scenario | Expected |
|---|----------|----------|
| 5.1 | DEV tries to call transition API directly | 403 returned |
| 5.2 | TESTER tries to close verified bug via API | 403 returned |
| 5.3 | TEAMLEAD tries to assign user from different team | Only own team users assignable |
| 5.4 | Create bug with no team → shows in list | Works correctly |
| 5.5 | AssigneeSelector with no matching devs | "No developers available" message |

---

## 6. Bug Title / Metadata Display

| # | Check | Expected |
|---|-------|----------|
| 6.1 | Bug detail page title | Title visible |
| 6.2 | Bug ID shown | Short ID visible (e.g., #abc12345) |
| 6.3 | Status badge | Correct status displayed |
| 6.4 | Priority shown | Correct priority displayed |

---

## How to Run Tests

### Start servers
```bash
# Terminal 1 - Server
cd bug-fix-app/server && npm run dev

# Terminal 2 - Client
cd bug-fix-app/client && npm run dev
```

### Open in browser
- Client: http://localhost:5173
- Login with test accounts above