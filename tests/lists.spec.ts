import { test, expect } from '@playwright/test';

test.describe('Shopping Lists Management', () => {

    test.beforeEach(async ({ page }) => {
        // Authenticate as a test user before each test
        const response = await page.request.post('/api/auth/test-login', {
            data: {
                email: 'lists-tester@example.com',
                name: 'Lists Tester'
            }
        });
        expect(response.ok()).toBeTruthy();
    });

    test('can create, rename, and delete a list', async ({ page }) => {
        await page.goto('/lists');

        // Create a new list
        const uniqueListName = `Test List ${Date.now()}`;
        await page.fill('input[placeholder="List name..."]', uniqueListName);
        await page.click('button:has-text("Create")');

        // Verify it was created
        await expect(page.locator('text=' + uniqueListName)).toBeVisible();

        // Rename the list
        const renamedListName = uniqueListName + ' Renamed';
        const listRow = page.locator('.flex.items-center.p-3').filter({ hasText: uniqueListName });
        
        await listRow.locator('button[title="Rename"]').click();
        // The listRow locator becomes stale because the text is replaced by an input.
        const editInput = page.locator('input[type="text"]:not([placeholder])').first();
        await editInput.fill(renamedListName);
        await editInput.press('Enter');

        await expect(page.locator('text=' + renamedListName)).toBeVisible();

        // Delete the list
        // Intercept confirm dialog
        page.on('dialog', dialog => dialog.accept());
        await page.locator('.flex.items-center.p-3').filter({ hasText: renamedListName }).locator('button[title="Delete list"]').click();

        await expect(page.locator('text=' + renamedListName)).not.toBeVisible();
    });

    test('can set a list as default', async ({ page }) => {
        await page.goto('/lists');

        // Create a new list
        const uniqueListName = `Default Test List ${Date.now()}`;
        await page.fill('input[placeholder="List name..."]', uniqueListName);
        await page.click('button:has-text("Create")');

        // Verify it was created
        await expect(page.locator('text=' + uniqueListName)).toBeVisible();

        const listRow = page.locator('.flex.items-center.p-3').filter({ hasText: uniqueListName });
        
        // Set as default, wait for api to finish so we don't navigate too early
        const defaultPromise = page.waitForResponse(r => r.url().includes('default') && r.status() === 200);
        await listRow.locator('button[title="Set as default"]').click();
        await defaultPromise;

        // Reload home page and see if it's the active one
        await page.goto('/');
        await expect(page.locator('button#list-selector')).toContainText(uniqueListName);
    });
});
