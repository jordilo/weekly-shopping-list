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

        const itemRow = page.locator('.group', { hasText: 'Carrots' });
        // Click the checkbox button specifically, not the whole row
        await itemRow.locator('button').filter({ has: page.locator('svg') }).click();

        // Check if it's completed
        await expect(page.getByText('Carrots')).toHaveClass(/line-through/);
    });

    test('should delete items via modal', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Donuts');
        await page.getByRole('button', { name: 'Add' }).click();

        // Click row to open modal
        await page.getByText('Donuts').click();
        
        // Handle confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Click delete in modal
        await page.getByRole('button', { name: 'Delete' }).click();

        await expect(page.getByText('Donuts')).not.toBeVisible();
    });

    test('should update quantity and category via modal', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Milk');
        await page.getByRole('button', { name: 'Add' }).click();

        // Click row to open modal
        await page.getByText('Milk').click();
        
        // Verify name is read-only
        await expect(page.getByLabel('Product Name')).toHaveAttribute('readonly', '');

        // Update quantity
        const qtyInput = page.getByLabel('Quantity');
        await qtyInput.fill('2 liters');

        // Update category
        await page.click('[id="category-select"]');
        await page.click('span:has-text("Dairy")');

        // Save
        await page.getByRole('button', { name: 'Save Changes' }).click();

        // Verify updates in list
        await expect(page.getByText('Qty: 2 liters')).toBeVisible();
        await expect(page.getByText('DAIRY')).toBeVisible(); 
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

        // Expect only one "Eggs"
        const items = await page.getByText(/Eggs/i).all();
        expect(items.length).toBe(1);
    });

    test('should show suggestions from history', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });

        const historyResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/history') && resp.status() === 200);

        await input.fill('Flour');
        await addButton.click();

        await expect(page.getByText('Flour')).toBeVisible();
        await historyResponsePromise;

        await page.reload();

        const option = page.locator('datalist#shopping-history option[value="Flour"]');
        await expect(option).toHaveAttribute('value', 'Flour');
    });

    test('should start a new week', async ({ page }) => {
        const newWeekButton = page.getByRole('button', { name: 'New Week' });

        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        const addButton = page.getByRole('button', { name: 'Add' });
        await input.fill('Old Item');
        await addButton.click();
        await expect(page.getByText('Old Item')).toBeVisible();

        page.on('dialog', dialog => dialog.accept());

        const metaResponsePromise = page.waitForResponse(resp => resp.url().includes('/api/meta') && resp.status() === 200);

        await newWeekButton.click();
        await metaResponsePromise;

        await expect(page.getByText('Old Item')).not.toBeVisible();
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
        
        await page.click('[id="category-select"]');
        await page.click('span:has-text("Produce")');
        await page.getByRole('button', { name: 'Save Changes' }).click();

        // 3. Verify it moved
        await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();

        // 4. Reload to verify persistence
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();
        await expect(page.getByText(uniqueName)).toBeVisible();

        // 5. Add again
        await page.getByText(uniqueName).click();
        page.on('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText(uniqueName)).not.toBeVisible();

        await input.fill(uniqueName);
        await addButton.click();

        // 6. Should be automatically in Produce
        await expect(page.getByRole('heading', { name: 'Produce' })).toBeVisible();
        const newItemRow = page.locator('.group', { hasText: uniqueName });
        await expect(newItemRow.getByText('PRODUCE')).toBeVisible();
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
