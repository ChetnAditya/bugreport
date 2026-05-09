import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

// ---------------------------------------------------------------------------
// 3.1  TEAMLEAD Alpha opens TransitionMenu → assignee dropdown
//     → Only Alpha team devs shown
// ---------------------------------------------------------------------------
test('3.1 TEAMLEAD Alpha sees only Alpha devs in assignee dropdown', async ({ page }) => {
  await login(page, 'TEAMLEAD_ALPHA');

  // Find a NEW bug (Alpha team) to trigger assign transition
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
  if (!(await changeBtn.isVisible())) {
    test.skip('Change status button not visible for this user');
    return;
  }
  await changeBtn.click();

  const assignOption = page.getByRole('menuitem', { name: /assign/i });
  await assignOption.click();

  // Dialog with assignee selector should be visible
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // Click the assignee dropdown
  const assigneeSelect = dialog.locator('button[aria-label="Assignee"], [role="combobox"]').first();
  await assigneeSelect.click();
  await page.waitForTimeout(300);

  // Get all visible options
  const options = await page.getByRole('option').allTextContents();

  // Alpha devs are carol.dev; Beta devs are dave.dev
  // Should contain carol.dev
  expect(options.some((o) => /carol/i.test(o))).toBeTruthy();
  // Should NOT contain dave.dev (Beta)
  expect(options.some((o) => /dave/i.test(o))).toBeFalsy();
});

// ---------------------------------------------------------------------------
// 3.2  TEAMLEAD Beta opens TransitionMenu → assignee dropdown
//     → Only Beta team devs shown
// ---------------------------------------------------------------------------
test('3.2 TEAMLEAD Beta sees only Beta devs in assignee dropdown', async ({ page }) => {
  await login(page, 'TEAMLEAD_BETA');

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
  if (!(await changeBtn.isVisible())) {
    test.skip('Change status button not visible for this user');
    return;
  }
  await changeBtn.click();

  const assignOption = page.getByRole('menuitem', { name: /assign/i });
  await assignOption.click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  const assigneeSelect = dialog.locator('button[aria-label="Assignee"], [role="combobox"]').first();
  await assigneeSelect.click();
  await page.waitForTimeout(300);

  const options = await page.getByRole('option').allTextContents();

  // Should contain dave.dev (Beta dev)
  expect(options.some((o) => /dave/i.test(o))).toBeTruthy();
  // Should NOT contain carol.dev (Alpha dev)
  expect(options.some((o) => /carol/i.test(o))).toBeFalsy();
});

// ---------------------------------------------------------------------------
// 3.3  SUPERADMIN opens TransitionMenu → assignee dropdown
//     → All devs shown (no filter)
// ---------------------------------------------------------------------------
test('3.3 SUPERADMIN sees all devs in assignee dropdown', async ({ page }) => {
  await login(page, 'SUPERADMIN');

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
  if (!(await changeBtn.isVisible())) {
    test.skip('Change status button not visible for this user');
    return;
  }
  await changeBtn.click();

  const assignOption = page.getByRole('menuitem', { name: /assign/i });
  await assignOption.click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  const assigneeSelect = dialog.locator('button[aria-label="Assignee"], [role="combobox"]').first();
  await assigneeSelect.click();
  await page.waitForTimeout(300);

  const options = await page.getByRole('option').allTextContents();

  // Should see both carol.dev (Alpha) and dave.dev (Beta)
  expect(options.some((o) => /carol/i.test(o))).toBeTruthy();
  expect(options.some((o) => /dave/i.test(o))).toBeTruthy();
});
