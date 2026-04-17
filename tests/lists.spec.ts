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
        await page.fill('[data-testid="new-list-input"]', uniqueListName);
        await page.click('button:has-text("Create")');

        // Verify it was created
        await expect(page.locator('text=' + uniqueListName)).toBeVisible();

        // Rename the list
        const renamedListName = uniqueListName + ' Renamed';
        const listRow = page.locator('.flex.items-center.p-4.px-6').filter({ hasText: uniqueListName });
        
        await listRow.locator('button[title="Rename"]').click();
        // The listRow locator becomes stale because the text is replaced by an input.
        const editInput = page.locator('[data-testid="rename-input"]').first();
        await editInput.fill(renamedListName);
        await editInput.press('Enter');

        await expect(page.locator('text=' + renamedListName)).toBeVisible();

        // Delete the list
        // Intercept confirm dialog
        page.on('dialog', dialog => dialog.accept());
        await page.locator('.flex.items-center.p-4.px-6').filter({ hasText: renamedListName }).locator('button[title="Delete list"]').click();

        await expect(page.locator('text=' + renamedListName)).not.toBeVisible();
    });

    test('can set a list as default', async ({ page }) => {
        await page.goto('/lists');

        // Create a new list
        const uniqueListName = `Default Test List ${Date.now()}`;
        await page.fill('[data-testid="new-list-input"]', uniqueListName);
        await page.click('button:has-text("Create")');

        await page.waitForTimeout(1000);
        // Verify it was created
        await expect(page.locator('text=' + uniqueListName)).toBeVisible();

        const listRow = page.locator('.flex.items-center.p-4.px-6').filter({ hasText: uniqueListName });
        
        // Set as default, wait for api to finish so we don't navigate too early
        const defaultPromise = page.waitForResponse(r => r.url().includes('default') && r.status() === 200);
        await listRow.locator('button[title="Set as default"]').click();
        await defaultPromise;

        // Reload home page and see if it's the active one
        // Clear localStorage so it falls back to the API default
        await page.evaluate(() => localStorage.removeItem('lastSelectedListId'));
        await page.goto('/');
        await expect(page.locator('button#list-selector')).toContainText(uniqueListName);
    });

    test('newly created list appears in header dropdown immediately', async ({ page }) => {
        await page.goto('/lists');

        const uniqueListName = `Header Test ${Date.now()}`;
        await page.fill('[data-testid="new-list-input"]', uniqueListName);
        await page.click('button:has-text("Create")');

        await expect(page.locator('text=' + uniqueListName)).toBeVisible();

        // Go back to Home and open the list selector dropdown
        await page.goto('/');
        await page.waitForTimeout(500); // Allow time for client to mount lists
        await page.click('button#list-selector');
        
        await expect(page.locator('.absolute.top-full')).toContainText(uniqueListName);
    });

    test('can navigate to a list directly from the lists page', async ({ page }) => {
        await page.goto('/lists');

        const uniqueListName = `Nav Test ${Date.now()}`;
        await page.fill('[data-testid="new-list-input"]', uniqueListName);
        await page.click('button:has-text("Create")');

        await expect(page.locator('text=' + uniqueListName)).toBeVisible();

        // Click on the list's name link
        await page.click(`a:has-text("${uniqueListName}")`);

        // Should navigate to Home with query param and set it as active
        await expect(page).toHaveURL(/.*listId=.+/);
        await expect(page.locator('button#list-selector')).toContainText(uniqueListName);
    });
});
