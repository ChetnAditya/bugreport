import { type Page } from '@playwright/test';

export const TEST_USERS = {
  SUPERADMIN: { email: 'superadmin@bugfix.local', password: 'SuperAdmin123', role: 'SUPERADMIN' as const },
  TEAMLEAD_ALPHA: { email: 'alice.lead@bugfix.local', password: 'Lead12345', role: 'TEAMLEAD' as const },
  TEAMLEAD_BETA: { email: 'bob.lead@bugfix.local', password: 'Lead12345', role: 'TEAMLEAD' as const },
  DEV_ALPHA: { email: 'carol.dev@bugfix.local', password: 'Dev12345', role: 'DEVELOPER' as const },
  DEV_BETA: { email: 'dave.dev@bugfix.local', password: 'Dev12345', role: 'DEVELOPER' as const },
  TESTER_ALPHA: { email: 'ellen.test@bugfix.local', password: 'Test1234', role: 'TESTER' as const },
  TESTER_BETA: { email: 'fred.test@bugfix.local', password: 'Test1234', role: 'TESTER' as const },
} as const;

export type TestUser = keyof typeof TEST_USERS;

export async function login(page: Page, user: TestUser) {
  const creds = TEST_USERS[user];
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByLabel(/password/i).fill(creds.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/');
}

export async function logout(page: Page) {
  await page.goto('/');
  // Look for logout in the nav
  const logoutBtn = page.getByRole('button', { name: /logout/i }).or(page.locator('button[aria-label="logout"]')).or(page.locator('button').filter({ hasText: /logout/i }));
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  }
  await page.waitForURL('**/login**');
}
