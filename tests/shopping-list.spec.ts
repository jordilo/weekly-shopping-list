import { test, expect } from '@playwright/test';

test.describe('Weekly Shopping List', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should allow adding items', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Apples');
        await page.getByRole('button', { name: 'Add' }).click();

        await expect(page.getByText('Apples')).toBeVisible();
    });

    test('should persist items after reload', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Bananas');
        await page.getByRole('button', { name: 'Add' }).click();

        await page.reload();
        await expect(page.getByText('Bananas')).toBeVisible();
    });

    test('should mark items as completed', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Carrots');
        await page.getByRole('button', { name: 'Add' }).click();

        const item = page.getByText('Carrots');
        await item.click(); // Click to toggle

        // Check if it moved to completed section (logic implies line-through style)
        await expect(item).toHaveClass(/line-through/);
    });

    test('should delete items', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Donuts');
        await page.getByRole('button', { name: 'Add' }).click();

        // Hover to reveal delete button
        const itemRow = page.locator('.group').filter({ hasText: 'Donuts' });
        await itemRow.hover();
        await itemRow.getByLabel('Delete item').click();

        await expect(page.getByText('Donuts')).not.toBeVisible();
    });

    test('should prevent duplicate items', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });

        // Add "Eggs"
        await input.fill('Eggs');
        await addButton.click();

        // Wait for first item to appear
        await expect(page.getByText('Eggs', { exact: true })).toBeVisible();

        // Try adding "eggs" (lowercase)
        await input.fill('eggs');
        await addButton.click();

        // Expect only one "Eggs" (or "eggs" depending on normalization, our logic keeps the first one)
        const items = await page.getByText(/Eggs/i).all();
        expect(items.length).toBe(1);
    });

    test('should show suggestions from history', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });

        // Add "Flour"
        // Wait for history API call to ensure it's saved before reload
        const historyResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/history') && resp.status() === 200);

        await input.fill('Flour');
        await addButton.click();

        // Wait for UI to update AND history to be saved
        await expect(page.getByText('Flour')).toBeVisible();
        await historyResponsePromise;

        // Reload to get fresh state (including history from server)
        await page.reload();

        // Check datalist
        // Note: Datalist options are hidden elements, but we can check if the datalist option exists in the DOM.
        const option = page.locator('datalist#shopping-history option[value="Flour"]');
        await expect(option).toHaveAttribute('value', 'Flour');
    });

    test('should start a new week', async ({ page }) => {
        const newWeekButton = page.getByRole('button', { name: 'New Week' });

        // Add an item first so we can see it clear
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });
        await input.fill('Old Item');
        await addButton.click();
        await expect(page.getByText('Old Item')).toBeVisible();

        // Handle confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Wait for meta update
        const metaResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/meta') && resp.status() === 200);

        await newWeekButton.click();

        await metaResponsePromise;

        // Verify items cleared
        await expect(page.getByText('Old Item')).not.toBeVisible();

        // Verify date updated (hard to test exact date string without mocking, 
        // but element should be visible)
        await expect(page.getByText(/Week of/)).toBeVisible();
    });

    test('should categorize items dynamically', async ({ page }) => {
        const uniqueName = `Dragonfruit-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });

        // 1. Add new item - should be Uncategorized
        await input.fill(uniqueName);
        await addButton.click();

        // Check it's under Uncategorized
        await expect(page.getByRole('heading', { name: 'Uncategorized' })).toBeVisible();
        await expect(page.getByText(uniqueName)).toBeVisible();

        // 2. Change category to "Produce"
        // Find the select associated with item
        const itemRow = page.locator('.group', { hasText: uniqueName });
        const categorySelect = itemRow.locator('select');

        // Wait for update request
        const updateResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/items') && resp.request().method() === 'PUT');

        await categorySelect.selectOption('Produce');

        const response = await updateResponsePromise;
        expect(response.status()).toBe(200);

        // 3. Verify it moved to Produce header
        await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();

        // 4. Reload to verify persistence
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();
        await expect(page.getByText(uniqueName)).toBeVisible();

        // 5. Add same item again (simulate next week or duplicate check)
        // First delete it to allow re-adding if we have duplicate check
        const deleteBtn = itemRow.getByRole('button', { name: 'Delete item' });
        await deleteBtn.click();
        await expect(page.getByText(uniqueName)).not.toBeVisible();

        // Add again
        await input.fill(uniqueName);
        await addButton.click();

        // 6. Should be automatically in "Produce" now (Learned!)
        await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();
        // Use first() if there are multiple Uncategorized headers (unlikely but safe) or check count 0 if possible
        // But simplest is check the item is NOT under Uncategorized.
        // However, if we have other Uncategorized items, the header might still be visible.
        // So we should check the ITEM is under Produce.
        // The previous expect checks Produce header is visible.
        // We can also check that the item row's select has value 'Produce'
        const newItemRow = page.locator('.group', { hasText: uniqueName });
        await expect(newItemRow.locator('select')).toHaveValue('Produce');
    });

    test('should refresh the list', async ({ page, request }) => {
        const uniqueName = `SecretItem-${Date.now()}`;

        // 1. Add item via API directly (simulating another user or device)
        const response = await request.post('/api/items', {
            data: {
                name: uniqueName,
                completed: false,
                category: 'Other',
                createdAt: Date.now()
            }
        });
        expect(response.ok()).toBeTruthy();

        // 2. Item should NOT be visible yet (we haven't refreshed)
        await expect(page.getByText(uniqueName)).not.toBeVisible();

        // 3. Click Refresh
        const refreshButton = page.getByRole('button', { name: 'Refresh list' });
        await refreshButton.click();

        // 4. Item SHOULD be visible now
        await expect(page.getByText(uniqueName)).toBeVisible();
    });
});
