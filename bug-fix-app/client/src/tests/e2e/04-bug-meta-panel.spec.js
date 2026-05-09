import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
// ---------------------------------------------------------------------------
// 4.1  BugMetaPanel shows team name
// ---------------------------------------------------------------------------
test('4.1 BugMetaPanel displays team name', async ({ page }) => {
    await login(page, 'TESTER_ALPHA');
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    // Open any bug that belongs to Alpha team
    const alphaBugRow = page.locator('tr', { hasText: /alpha|beta/i }).filter({ hasText: /CRITICAL|HIGH|MEDIUM|LOW/ }).first();
    if (await alphaBugRow.count() === 0) {
        test.skip('No bugs found');
        return;
    }
    await alphaBugRow.locator('a').first().click();
    await page.waitForURL(/\/bugs\/.+/);
    // Meta panel should show team name
    const metaPanel = page.locator('aside');
    await expect(metaPanel).toBeVisible();
    await expect(metaPanel.locator('text=/alpha squad|beta squad|team/i')).toBeVisible();
});
// ---------------------------------------------------------------------------
// 4.2  BugMetaPanel shows reporter name
// ---------------------------------------------------------------------------
test('4.2 BugMetaPanel displays reporter name', async ({ page }) => {
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
    const metaPanel = page.locator('aside');
    await expect(metaPanel).toBeVisible();
    // Reporter label should be visible
    await expect(metaPanel.locator('text=/reporter/i')).toBeVisible();
    // Reporter name should be shown (e.g. "Ellen Test", "Fred Test")
    const reporterName = metaPanel.locator('text=/ellen|fred|carol|dave|alice|bob|superadmin/i');
    await expect(reporterName.first()).toBeVisible();
});
// ---------------------------------------------------------------------------
// 4.3  BugMetaPanel shows assignee or "Unassigned"
// ---------------------------------------------------------------------------
test('4.3 BugMetaPanel displays assignee or "Unassigned"', async ({ page }) => {
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
    const metaPanel = page.locator('aside');
    await expect(metaPanel).toBeVisible();
    await expect(metaPanel.locator('text=/assignee/i')).toBeVisible();
    // Should show either a name or "Unassigned"
    const hasAssignee = await metaPanel.locator('text=/unassigned/i').count() > 0
        || await metaPanel.locator('text=/carol|dave|ellen|fred|alice|bob/i').count() > 0;
    await expect(hasAssignee).toBeTruthy();
});
