import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
// ---------------------------------------------------------------------------
// 6.1  Bug detail page shows the bug title
// ---------------------------------------------------------------------------
test('6.1 Bug detail page displays the bug title', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    // Click on first bug
    const bugRow = page.locator('tr').filter({ hasText: /CRITICAL|HIGH|MEDIUM|LOW/ }).first();
    if (await bugRow.count() === 0) {
        test.skip('No bugs found');
        return;
    }
    const bugTitleText = await bugRow.locator('td').first().textContent();
    await bugRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    // Title should contain something from the row
    if (bugTitleText) {
        await expect(heading).toContainText(bugTitleText.trim());
    }
});
// ---------------------------------------------------------------------------
// 6.2  Bug ID is shown on detail page (short ID, e.g. #abc12345)
// ---------------------------------------------------------------------------
test('6.2 Bug detail page shows the bug ID', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const bugRow = page.locator('tr').filter({ hasText: /CRITICAL|HIGH|MEDIUM|LOW/ }).first();
    if (await bugRow.count() === 0) {
        test.skip('No bugs found');
        return;
    }
    await bugRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    // Bug ID is shown in meta panel (e.g., "id: abc12345")
    const metaPanel = page.locator('aside');
    await expect(metaPanel).toBeVisible();
    // The ID should be visible in monospace font in the meta panel
    const idText = metaPanel.locator('text=/id:\\s*[a-z0-9]+/i');
    await expect(idText).toBeVisible();
});
// ---------------------------------------------------------------------------
// 6.3  Status badge is visible on bug detail page
// ---------------------------------------------------------------------------
test('6.3 Bug detail page displays the correct status badge', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const bugRow = page.locator('tr').filter({ hasText: /CRITICAL|HIGH|MEDIUM|LOW/ }).first();
    if (await bugRow.count() === 0) {
        test.skip('No bugs found');
        return;
    }
    // Get the status from the row
    const rowStatusText = await bugRow.locator('td').nth(1).textContent();
    await bugRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    // Meta panel shows status
    const metaPanel = page.locator('aside');
    await expect(metaPanel).toBeVisible();
    await expect(metaPanel.locator('text=/status/i')).toBeVisible();
    // Status badge should show the actual status
    const statusBadge = metaPanel.locator('[class*="badge"], [class*="status"], [class*="chip"]').first();
    if (await statusBadge.count() > 0) {
        if (rowStatusText) {
            await expect(statusBadge).toContainText(rowStatusText.trim());
        }
    }
});
// ---------------------------------------------------------------------------
// 6.4  Priority is shown on bug detail page
// ---------------------------------------------------------------------------
test('6.4 Bug detail page displays the correct priority', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    const bugRow = page.locator('tr').filter({ hasText: /CRITICAL|HIGH|MEDIUM|LOW/ }).first();
    if (await bugRow.count() === 0) {
        test.skip('No bugs found');
        return;
    }
    // Get the priority from the row
    const rowPriorityText = await bugRow.locator('td').nth(2).textContent();
    await bugRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    const metaPanel = page.locator('aside');
    await expect(metaPanel).toBeVisible();
    await expect(metaPanel.locator('text=/priority/i')).toBeVisible();
    // Should show priority P1-P4 or null
    const priorityBadge = metaPanel.locator('text=/P[1-4]|none|null/i');
    if (await priorityBadge.count() > 0) {
        if (rowPriorityText) {
            await expect(priorityBadge.first()).toContainText(rowPriorityText.trim());
        }
    }
});
