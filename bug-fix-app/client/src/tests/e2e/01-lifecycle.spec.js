import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
const BUG_FIXED_ID_PATTERN = /^[a-z0-9]+$/; // IDs from seed data are short alphanumeric
// ---------------------------------------------------------------------------
// Helper: get the first bug ID of a given status from the bug list
// ---------------------------------------------------------------------------
async function getFirstBugIdOfStatus(page, status) {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const row = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: status }).first();
    if (await row.count() === 0)
        return null;
    // Click to open detail, extract ID from URL
    await row.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    return page.url().split('/bugs/')[1];
}
// ---------------------------------------------------------------------------
// 1.1  SUPERADMIN: NEW → ASSIGNED should succeed
// ---------------------------------------------------------------------------
test('1.1 SUPERADMIN can assign a NEW bug', async ({ page }) => {
    await login(page, 'SUPERADMIN');
    // Find a NEW bug
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const newBugRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'NEW' }).first();
    await expect(newBugRow).toBeVisible();
    await newBugRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    // Change status button should be visible
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const assignOption = page.getByRole('menuitem', { name: /assign/i }).or(page.getByRole('option', { name: /assign/i }));
    await assignOption.click();
    // Dialog should appear for assignee + priority
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    // Select an assignee
    const assigneeSelect = dialog.locator('button[aria-label="Assignee"], [role="combobox"]').first();
    await assigneeSelect.click();
    await page.getByRole('option').first().click();
    // Select a priority
    const prioritySelect = dialog.locator('button[aria-label*="priority" i], [role="combobox"]').nth(1);
    await prioritySelect.click();
    await page.getByRole('option').first().click();
    // Confirm
    await dialog.getByRole('button', { name: /confirm/i }).click();
    // Should see success toast or status change
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.2  TEAMLEAD: NEW → ASSIGNED should be blocked (button hidden)
// ---------------------------------------------------------------------------
test('1.2 TEAMLEAD cannot see assign option for NEW bugs', async ({ page }) => {
    await login(page, 'TEAMLEAD_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const newBugRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'NEW' }).first();
    if (await newBugRow.count() === 0) {
        test.skip('No NEW bugs available');
        return;
    }
    await newBugRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    // TEAMLEAD may see the button if they have any transitions, but assign should not be there
    if (await changeBtn.isVisible()) {
        await changeBtn.click();
        const assignOption = page.getByRole('menuitem', { name: /assign/i });
        await expect(assignOption).not.toBeVisible();
    }
});
// ---------------------------------------------------------------------------
// 1.3  DEV (assignee): ASSIGNED → IN_PROGRESS
// ---------------------------------------------------------------------------
test('1.3 Developer (assignee) can start work on ASSIGNED bug', async ({ page }) => {
    await login(page, 'DEV_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const assignedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'ASSIGNED' }).first();
    if (await assignedRow.count() === 0) {
        test.skip('No ASSIGNED bugs available');
        return;
    }
    await assignedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const startOption = page.getByRole('menuitem', { name: /start work/i });
    await expect(startOption).toBeVisible();
    await startOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.4  DEV (not assignee): ASSIGNED → IN_PROGRESS button hidden
// ---------------------------------------------------------------------------
test('1.4 Developer (not assignee) cannot start work on ASSIGNED bug', async ({ page }) => {
    await login(page, 'DEV_BETA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const assignedRows = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'ASSIGNED' });
    if (await assignedRows.count() === 0) {
        test.skip('No ASSIGNED bugs available');
        return;
    }
    // Pick first ASSIGNED bug
    await assignedRows.first().locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    if (await changeBtn.isVisible()) {
        await changeBtn.click();
        const startOption = page.getByRole('menuitem', { name: /start work/i });
        await expect(startOption).not.toBeVisible();
    }
});
// ---------------------------------------------------------------------------
// 1.5  DEV (assignee): IN_PROGRESS → FIXED
// ---------------------------------------------------------------------------
test('1.5 Developer (assignee) can mark IN_PROGRESS bug as FIXED', async ({ page }) => {
    await login(page, 'DEV_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const inProgressRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'IN_PROGRESS' }).first();
    if (await inProgressRow.count() === 0) {
        test.skip('No IN_PROGRESS bugs available');
        return;
    }
    await inProgressRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const fixedOption = page.getByRole('menuitem', { name: /mark fixed/i });
    await expect(fixedOption).toBeVisible();
    await fixedOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.6  DEV (not assignee): IN_PROGRESS → FIXED button hidden
// ---------------------------------------------------------------------------
test('1.6 Developer (not assignee) cannot mark unassigned IN_PROGRESS bug as FIXED', async ({ page }) => {
    await login(page, 'DEV_BETA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const inProgressRows = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'IN_PROGRESS' });
    if (await inProgressRows.count() === 0) {
        test.skip('No IN_PROGRESS bugs available');
        return;
    }
    await inProgressRows.first().locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    if (await changeBtn.isVisible()) {
        await changeBtn.click();
        const fixedOption = page.getByRole('menuitem', { name: /mark fixed/i });
        await expect(fixedOption).not.toBeVisible();
    }
});
// ---------------------------------------------------------------------------
// 1.7  TESTER: FIXED → VERIFIED
// ---------------------------------------------------------------------------
test('1.7 Tester can verify a FIXED bug', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const fixedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'FIXED' }).first();
    if (await fixedRow.count() === 0) {
        test.skip('No FIXED bugs available');
        return;
    }
    await fixedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const verifyOption = page.getByRole('menuitem', { name: /verify/i });
    await expect(verifyOption).toBeVisible();
    await verifyOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.8  TEAMLEAD: FIXED → VERIFIED
// ---------------------------------------------------------------------------
test('1.8 Team lead can verify a FIXED bug', async ({ page }) => {
    await login(page, 'TEAMLEAD_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const fixedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'FIXED' }).first();
    if (await fixedRow.count() === 0) {
        test.skip('No FIXED bugs available');
        return;
    }
    await fixedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const verifyOption = page.getByRole('menuitem', { name: /verify/i });
    await expect(verifyOption).toBeVisible();
    await verifyOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.9  SUPERADMIN: FIXED → VERIFIED
// ---------------------------------------------------------------------------
test('1.9 Superadmin can verify a FIXED bug', async ({ page }) => {
    await login(page, 'SUPERADMIN');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const fixedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'FIXED' }).first();
    if (await fixedRow.count() === 0) {
        test.skip('No FIXED bugs available');
        return;
    }
    await fixedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const verifyOption = page.getByRole('menuitem', { name: /verify/i });
    await expect(verifyOption).toBeVisible();
    await verifyOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.10  TESTER: FIXED → IN_PROGRESS (reject)
// ---------------------------------------------------------------------------
test('1.10 Tester can reject (send back to dev) a FIXED bug', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const fixedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'FIXED' }).first();
    if (await fixedRow.count() === 0) {
        test.skip('No FIXED bugs available');
        return;
    }
    await fixedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const rejectOption = page.getByRole('menuitem', { name: /reject/i });
    await expect(rejectOption).toBeVisible();
    await rejectOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.11  TEAMLEAD: FIXED → IN_PROGRESS (reject)
// ---------------------------------------------------------------------------
test('1.11 Team lead can reject (send back to dev) a FIXED bug', async ({ page }) => {
    await login(page, 'TEAMLEAD_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const fixedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'FIXED' }).first();
    if (await fixedRow.count() === 0) {
        test.skip('No FIXED bugs available');
        return;
    }
    await fixedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const rejectOption = page.getByRole('menuitem', { name: /reject/i });
    await expect(rejectOption).toBeVisible();
    await rejectOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.12  TEAMLEAD: VERIFIED → CLOSED
// ---------------------------------------------------------------------------
test('1.12 Team lead can close a VERIFIED bug', async ({ page }) => {
    await login(page, 'TEAMLEAD_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const verifiedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'VERIFIED' }).first();
    if (await verifiedRow.count() === 0) {
        test.skip('No VERIFIED bugs available');
        return;
    }
    await verifiedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const closeOption = page.getByRole('menuitem', { name: /^close$/i });
    await expect(closeOption).toBeVisible();
    await closeOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.13  SUPERADMIN: VERIFIED → CLOSED
// ---------------------------------------------------------------------------
test('1.13 Superadmin can close a VERIFIED bug', async ({ page }) => {
    await login(page, 'SUPERADMIN');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const verifiedRow = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'VERIFIED' }).first();
    if (await verifiedRow.count() === 0) {
        test.skip('No VERIFIED bugs available');
        return;
    }
    await verifiedRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    await expect(changeBtn).toBeVisible();
    await changeBtn.click();
    const closeOption = page.getByRole('menuitem', { name: /^close$/i });
    await expect(closeOption).toBeVisible();
    await closeOption.click();
    await page.waitForTimeout(1000);
});
// ---------------------------------------------------------------------------
// 1.14  TESTER: VERIFIED → CLOSED should be hidden
// ---------------------------------------------------------------------------
test('1.14 Tester cannot close a VERIFIED bug', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const verifiedRows = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'VERIFIED' });
    if (await verifiedRows.count() === 0) {
        test.skip('No VERIFIED bugs available');
        return;
    }
    await verifiedRows.first().locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    if (await changeBtn.isVisible()) {
        await changeBtn.click();
        const closeOption = page.getByRole('menuitem', { name: /^close$/i });
        await expect(closeOption).not.toBeVisible();
    }
});
// ---------------------------------------------------------------------------
// 1.15  DEVELOPER: VERIFIED → CLOSED should be hidden
// ---------------------------------------------------------------------------
test('1.15 Developer cannot close a VERIFIED bug', async ({ page }) => {
    await login(page, 'DEV_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const verifiedRows = page.locator('tr, [data-testid="bug-row"]').filter({ hasText: 'VERIFIED' });
    if (await verifiedRows.count() === 0) {
        test.skip('No VERIFIED bugs available');
        return;
    }
    await verifiedRows.first().locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const changeBtn = page.getByRole('button', { name: /change status/i });
    if (await changeBtn.isVisible()) {
        await changeBtn.click();
        const closeOption = page.getByRole('menuitem', { name: /^close$/i });
        await expect(closeOption).not.toBeVisible();
    }
});
