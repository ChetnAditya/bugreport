import { type Page, type Locator } from '@playwright/test';

export class BugListPage {
  readonly page: Page;
  readonly newBugBtn: Locator;
  readonly bugRows: Locator;
  readonly filterBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newBugBtn = page.getByRole('link', { name: /new bug/i }).or(page.getByRole('button', { name: /new bug/i }));
    this.bugRows = page.locator('[data-testid="bug-row"]').or(page.locator('tr').filter({ has: page.locator('[class*="bug"]') }));
    this.filterBar = page.getByRole('searchbox', { name: /filter/i }).or(page.getByPlaceholder(/filter/i));
  }

  async goto() {
    await this.page.goto('/bugs');
    await this.page.waitForLoadState('networkidle');
  }

  async openBug(title: string) {
    await this.page.locator('tr, [data-testid="bug-row"]').filter({ hasText: title }).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async getBugRow(title: string) {
    return this.page.locator('tr, [data-testid="bug-row"]').filter({ hasText: title }).first();
  }
}

export class BugDetailPage {
  readonly page: Page;
  readonly transitionBtn: Locator;
  readonly metaPanel: Locator;
  readonly bugTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.transitionBtn = page.getByRole('button', { name: /change status/i }).or(page.getByRole('button', { name: /change status/i }));
    this.metaPanel = page.locator('[data-testid="bug-meta-panel"]').or(page.locator('aside'));
    this.bugTitle = page.locator('h1').first();
  }

  async goto(bugId: string) {
    await this.page.goto(`/bugs/${bugId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async openTransitionMenu() {
    await this.transitionBtn.click();
  }

  getTransitionOption(label: string) {
    return this.page.getByRole('menuitem', { name: new RegExp(label, 'i') })
      .or(this.page.getByRole('option', { name: new RegExp(label, 'i') }));
  }

  async selectTransition(label: string) {
    await this.openTransitionMenu();
    await this.getTransitionOption(label).click();
  }
}

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole('button', { name: /sign in/i }).click();
    await this.page.waitForURL('**/');
  }
}

export class TeamsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/teams');
    await this.page.waitForLoadState('networkidle');
  }
}

export class UsersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/users');
    await this.page.waitForLoadState('networkidle');
  }
}
