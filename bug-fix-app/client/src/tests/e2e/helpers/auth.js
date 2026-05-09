export const TEST_USERS = {
    SUPERADMIN: { email: 'superadmin@bugfix.local', password: 'SuperAdmin123', role: 'SUPERADMIN' },
    TEAMLEAD_ALPHA: { email: 'alice.lead@bugfix.local', password: 'Lead12345', role: 'TEAMLEAD' },
    TEAMLEAD_BETA: { email: 'bob.lead@bugfix.local', password: 'Lead12345', role: 'TEAMLEAD' },
    DEV_ALPHA: { email: 'carol.dev@bugfix.local', password: 'Dev12345', role: 'DEVELOPER' },
    DEV_BETA: { email: 'dave.dev@bugfix.local', password: 'Dev12345', role: 'DEVELOPER' },
    TESTER_ALPHA: { email: 'ellen.test@bugfix.local', password: 'Test1234', role: 'TESTER' },
    TESTER_BETA: { email: 'fred.test@bugfix.local', password: 'Test1234', role: 'TESTER' },
};
export async function login(page, user) {
    const creds = TEST_USERS[user];
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(creds.email);
    await page.getByLabel(/password/i).fill(creds.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/');
}
export async function logout(page) {
    await page.goto('/');
    // Look for logout in the nav
    const logoutBtn = page.getByRole('button', { name: /logout/i }).or(page.locator('button[aria-label="logout"]')).or(page.locator('button').filter({ hasText: /logout/i }));
    if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
    }
    await page.waitForURL('**/login**');
}
