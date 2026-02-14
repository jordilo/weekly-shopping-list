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

        // Add item to seed history
        await input.fill('Flour');
        await addButton.click();

        // Reload to ensure history is saved and page state is fresh
        await page.reload();

        // Type 'F' and check for suggestion
        await input.fill('F');

        // Note: testing datalist visibility is tricky in some browsers/drivers, 
        // but we can check if the datalist option exists in the DOM.
        const option = page.locator('datalist#shopping-history option[value="Flour"]');
        await expect(option).toHaveAttribute('value', 'Flour');
    });

    test('should start a new week', async ({ page }) => {
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Grapes');
        await page.getByRole('button', { name: 'Add' }).click();

        // Handle confirm dialog
        page.on('dialog', dialog => dialog.accept());

        await page.getByText('New Week').click();

        await expect(page.getByText('Grapes')).not.toBeVisible();

        // Check if date updated (hard to test exact date string without mocking, 
        // but element should be visible)
        await expect(page.getByText(/Week of/)).toBeVisible();
    });
});
