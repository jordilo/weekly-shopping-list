import { test, expect } from '@playwright/test';

test.describe('Weekly Shopping List', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear local storage to start fresh
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('should allow adding items', async ({ page }) => {
        const itemName = `Apples-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill(itemName);
        await page.getByRole('button', { name: 'Add' }).click();

        await expect(page.getByText(itemName)).toBeVisible();
    });

    test('should persist items after reload', async ({ page }) => {
        const itemName = `Bananas-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill(itemName);
        await page.getByRole('button', { name: 'Add' }).click();

        await page.reload();
        await expect(page.getByText(itemName)).toBeVisible();
    });

    test('should mark items as completed', async ({ page }) => {
        const itemName = `Carrots-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill(itemName);
        await page.getByRole('button', { name: 'Add' }).click();

        const itemRow = page.locator('.group', { hasText: itemName });
        // Click the checkbox button specifically, not the whole row
        await itemRow.locator('button').filter({ has: page.locator('svg') }).click();

        // Check if it's completed
        await expect(page.getByText(itemName)).toHaveClass(/line-through/);
    });

    test('should delete items via modal', async ({ page }) => {
        const itemName = `Donuts-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill(itemName);
        await page.getByRole('button', { name: 'Add' }).click();

        // Click row to open modal
        await page.getByText(itemName).click();
        
        // Handle confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Click delete in modal
        await page.getByRole('button', { name: 'Delete' }).click();

        await expect(page.getByText(itemName)).not.toBeVisible();
    });

    test('should update quantity and category via modal', async ({ page }) => {
        const itemName = `Milk-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill(itemName);
        await page.getByRole('button', { name: 'Add' }).click();

        // Click row to open modal
        await page.getByText(itemName).click();
        
        // Verify name is read-only
        await expect(page.getByLabel('Product Name')).toHaveAttribute('readonly', '');

        // Update quantity
        const qtyInput = page.getByLabel('Quantity');
        await qtyInput.fill('2 liters');

        // Update category
        await page.getByRole('button', { name: 'Uncategorized' }).click();
        
        const listboxCategory = page.locator('ul[role="listbox"]');
        await listboxCategory.waitFor({ state: 'visible' });
        const optionToSelect = listboxCategory.locator('li[role="option"]').filter({ hasNotText: /^Uncategorized$/i }).first();
        const categoryName = await optionToSelect.textContent() || 'Dairy';
        await optionToSelect.click({ force: true });

        // Save
        await page.getByRole('button', { name: 'Save Changes' }).click();

        // Verify updates in list
        await expect(page.getByText('Qty: 2 liters')).toBeVisible();
        await expect(page.getByRole('heading', { name: categoryName, exact: true })).toBeVisible(); 
    });

    test('should prevent duplicate items', async ({ page }) => {
        const baseName = `Eggs-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });

        // Add
        await input.fill(baseName);
        await addButton.click();

        // Wait for first item to appear
        await expect(page.getByText(baseName, { exact: true })).toBeVisible();

        // Try adding (lowercase)
        await input.fill(baseName.toLowerCase());
        await addButton.click();

        // Expect only one
        const items = await page.getByText(new RegExp(baseName, 'i')).all();
        expect(items.length).toBe(1);
    });

    test('should show suggestions from history', async ({ page }) => {
        const itemName = `Flour-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });

        const historyResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/history') && resp.status() === 200);

        await input.fill(itemName);
        await addButton.click();

        await expect(page.getByText(itemName)).toBeVisible();
        await historyResponsePromise;

        await page.reload();

        const option = page.locator(`datalist#shopping-history option[value="${itemName}"]`);
        await expect(option).toHaveAttribute('value', itemName);
    });

    test('should start a new week', async ({ page }) => {
        const itemName = `OldItem-${Date.now()}`;
        const newWeekButton = page.getByRole('button', { name: 'New Week' });

        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });
        await input.fill(itemName);
        await addButton.click();
        await expect(page.getByText(itemName)).toBeVisible();

        page.on('dialog', dialog => dialog.accept());

        const metaResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/meta') && resp.status() === 200);

        await newWeekButton.click();
        await metaResponsePromise;

        await expect(page.getByText(itemName)).not.toBeVisible();
        await expect(page.getByText(/Week of/)).toBeVisible();
    });

    test('should categorize items dynamically via modal', async ({ page }) => {
        const uniqueName = `Dragonfruit-${Date.now()}`;
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });

        // 1. Add new item - should be Uncategorized
        await input.fill(uniqueName);
        await addButton.click();

        await expect(page.getByRole('heading', { name: 'Uncategorized' })).toBeVisible();
        await expect(page.getByText(uniqueName)).toBeVisible();

        // 2. Change category via modal
        await page.getByText(uniqueName).click();
        
        await page.getByRole('button', { name: 'Uncategorized' }).click();
        const listboxCategory = page.locator('ul[role="listbox"]');
        await listboxCategory.waitFor({ state: 'visible' });
        const optionToSelect = listboxCategory.locator('li[role="option"]').filter({ hasNotText: /^Uncategorized$/i }).first();
        const categoryName = await optionToSelect.textContent() || 'Produce';
        await optionToSelect.click({ force: true });
        const savePromise = page.waitForResponse(resp => resp.url().includes('/api/items') && [200, 201].includes(resp.status()));
        await page.getByRole('button', { name: 'Save Changes' }).click();
        await savePromise;

        // 3. Verify it moved
        await expect(page.getByRole('heading', { name: categoryName, exact: true })).toBeVisible();

        // 4. Reload to verify persistence
        await page.reload();
        await expect(page.getByRole('heading', { name: categoryName, exact: true })).toBeVisible();
        await expect(page.getByText(uniqueName)).toBeVisible();

        // 5. Add again
        await page.getByText(uniqueName).click();
        page.on('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText(uniqueName)).not.toBeVisible();

        await input.fill(uniqueName);
        await addButton.click();

        // 6. Should be automatically in the new category
        await expect(page.getByRole('heading', { name: categoryName, exact: true })).toBeVisible();
        const newItemRow = page.locator('.group', { hasText: uniqueName });
        await expect(newItemRow.getByText(categoryName.toUpperCase())).toBeVisible();
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
