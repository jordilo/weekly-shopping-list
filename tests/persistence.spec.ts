import { test, expect } from '@playwright/test';

test.describe('List Persistence via URL', () => {

    let secondListId: string;
    let secondListName: string;

    test.beforeEach(async ({ page, request }) => {
        // Authenticate
        await page.request.post('/api/auth/test-login', {
            data: { email: 'persistence-tester@example.com', name: 'Persistence Tester' }
        });
        await request.post('/api/auth/test-login', {
            data: { email: 'persistence-tester@example.com', name: 'Persistence Tester' }
        });

        // Ensure we have at least 2 lists
        const listsRes = await request.get('/api/lists');
        const lists = await listsRes.json();

        if (lists.length < 2) {
            secondListName = `Persistence Test List ${Date.now()}`;
            const createRes = await request.post('/api/lists', {
                data: { name: secondListName }
            });
            const created = await createRes.json();
            secondListId = created.id;
        } else {
            // Use the second list (not the default one)
            secondListId = lists[1].id;
            secondListName = lists[1].name;
        }

        // Clear localStorage for a clean test state
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test('URL updates with listId when selecting a different list', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // Should have a listId in the URL after load
        await page.waitForURL(/listId=/);

        // Open the list picker and select the second list
        const listSelector = page.locator('button#list-selector');
        if (await listSelector.isVisible()) {
            await listSelector.click();

            // Click the second list in the dropdown (exclude the selector button itself)
            const dropdown = page.locator('.absolute');
            const listOption = dropdown.getByRole('button', { name: secondListName, exact: true });
            await listOption.click();

            // URL should contain the second list's ID
            await page.waitForURL(new RegExp(`listId=${secondListId}`));
            expect(page.url()).toContain(`listId=${secondListId}`);
        }
    });

    test('selected list persists after hard refresh', async ({ page }) => {
        // Navigate directly with the second list's ID in the URL
        await page.goto(`/?listId=${secondListId}`);
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // Verify the URL has the correct listId
        expect(page.url()).toContain(`listId=${secondListId}`);

        // Hard refresh
        await page.reload();
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // URL should still contain the second list's ID
        await page.waitForURL(new RegExp(`listId=${secondListId}`));
        expect(page.url()).toContain(`listId=${secondListId}`);

        // The header should show the second list's name
        const listSelector = page.locator('button#list-selector');
        if (await listSelector.isVisible()) {
            await expect(listSelector).toContainText(secondListName);
        }
    });

    test('navigating to / without listId restores last-selected list from localStorage', async ({ page }) => {
        // First visit with the second list to save it in localStorage
        await page.goto(`/?listId=${secondListId}`);
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // Verify localStorage was set
        const savedId = await page.evaluate(() => localStorage.getItem('lastSelectedListId'));
        expect(savedId).toBe(secondListId);

        // Navigate to / without any listId
        await page.goto('/');
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // The URL should be updated to include the last-selected list
        await page.waitForURL(new RegExp(`listId=${secondListId}`));
        expect(page.url()).toContain(`listId=${secondListId}`);
    });

    test('direct navigation to /?listId=<id> shows correct list', async ({ page }) => {
        await page.goto(`/?listId=${secondListId}`);
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // The header should show the second list's name
        const listSelector = page.locator('button#list-selector');
        if (await listSelector.isVisible()) {
            await expect(listSelector).toContainText(secondListName);
        }

        // URL should still have the correct listId
        expect(page.url()).toContain(`listId=${secondListId}`);
    });
});
