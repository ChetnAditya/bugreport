export class BugListPage {
    page;
    newBugBtn;
    bugRows;
    filterBar;
    constructor(page) {
        this.page = page;
        this.newBugBtn = page.getByRole('link', { name: /new bug/i }).or(page.getByRole('button', { name: /new bug/i }));
        this.bugRows = page.locator('[data-testid="bug-row"]').or(page.locator('tr').filter({ has: page.locator('[class*="bug"]') }));
        this.filterBar = page.getByRole('searchbox', { name: /filter/i }).or(page.getByPlaceholder(/filter/i));
    }
    async goto() {
        await this.page.goto('/bugs');
        await this.page.waitForLoadState('networkidle');
    }
    async openBug(title) {
        await this.page.locator('tr, [data-testid="bug-row"]').filter({ hasText: title }).first().click();
        await this.page.waitForLoadState('networkidle');
    }
    async getBugRow(title) {
        return this.page.locator('tr, [data-testid="bug-row"]').filter({ hasText: title }).first();
    }
}
export class BugDetailPage {
    page;
    transitionBtn;
    metaPanel;
    bugTitle;
    constructor(page) {
        this.page = page;
        this.transitionBtn = page.getByRole('button', { name: /change status/i }).or(page.getByRole('button', { name: /change status/i }));
        this.metaPanel = page.locator('[data-testid="bug-meta-panel"]').or(page.locator('aside'));
        this.bugTitle = page.locator('h1').first();
    }
    async goto(bugId) {
        await this.page.goto(`/bugs/${bugId}`);
        await this.page.waitForLoadState('networkidle');
    }
    async openTransitionMenu() {
        await this.transitionBtn.click();
    }
    getTransitionOption(label) {
        return this.page.getByRole('menuitem', { name: new RegExp(label, 'i') })
            .or(this.page.getByRole('option', { name: new RegExp(label, 'i') }));
    }
    async selectTransition(label) {
        await this.openTransitionMenu();
        await this.getTransitionOption(label).click();
    }
}
export class LoginPage {
    page;
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');
    }
    async login(email, password) {
        await this.page.getByLabel(/email/i).fill(email);
        await this.page.getByLabel(/password/i).fill(password);
        await this.page.getByRole('button', { name: /sign in/i }).click();
        await this.page.waitForURL('**/');
    }
}
export class TeamsPage {
    page;
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/teams');
        await this.page.waitForLoadState('networkidle');
    }
}
export class UsersPage {
    page;
    constructor(page) {
        this.page = page;
    }
    async goto() {
        await this.page.goto('/users');
        await this.page.waitForLoadState('networkidle');
    }
}
