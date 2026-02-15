import { test, expect } from '@playwright/test';

test.describe('Items Manager', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/items');
        // Clear local storage just in case
        await page.evaluate(() => localStorage.clear());
        await expect(page.getByText('Loading...')).not.toBeVisible();
    });

    test('should allow adding a new master item', async ({ page }) => {
        const uniqueName = `TestItem-${Date.now()}`;

        await page.getByPlaceholder('Item name (e.g. Milk)...').fill(uniqueName);
        await page.getByRole('button', { name: 'Add' }).click();

        await expect(page.getByText(uniqueName)).toBeVisible();
        await expect(page.getByPlaceholder('Item name (e.g. Milk)...')).toHaveValue('');
    });

    test('should allow searching for items', async ({ page }) => {
        const uniqueSuffix = Date.now().toString();
        const item1 = `SearchItem1-${uniqueSuffix}`;
        const item2 = `OtherItem-${uniqueSuffix}`;

        // Add two items
        const nameInput = page.getByPlaceholder('Item name (e.g. Milk)...');
        const addButton = page.getByRole('button', { name: 'Add' });

        await nameInput.fill(item1);
        await addButton.click();
        await expect(page.getByText(item1)).toBeVisible({ timeout: 10000 });

        await nameInput.fill(item2);
        await addButton.click();
        await expect(page.getByText(item2)).toBeVisible({ timeout: 10000 });

        // Search for item1
        const searchInput = page.getByTestId('search-input');
        await searchInput.fill(item1);

        // Wait for filter to apply - searching should be immediate
        // Using toBeAttached instead of toBeVisible to avoid flakiness with scroll position
        await expect(page.getByText(item1)).toBeAttached({ timeout: 15000 });
        await expect(page.getByText(item2)).not.toBeAttached({ timeout: 15000 });
    });

    test('should allow editing an item name', async ({ page }) => {
        const uniqueSuffix = Date.now().toString();
        const originalName = `EditMe-${uniqueSuffix}`;
        const newName = `Renamed-${uniqueSuffix}`;

        // Add item
        await page.getByPlaceholder('Item name (e.g. Milk)...').fill(originalName);
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText(originalName)).toBeVisible({ timeout: 10000 });

        // Start editing
        const row = page.locator('.group').filter({ hasText: originalName });
        await row.getByTitle('Edit Item').click();

        // Find the input - it's the 3rd textbox on the page when editing
        // (0: Add, 1: Search, 2: Edit)
        const editInput = page.getByRole('textbox').nth(2);
        await expect(editInput).toBeVisible({ timeout: 10000 });
        await editInput.fill(newName);

        // Save changes
        await page.getByTitle('Save Changes').click();

        // Verify update
        await expect(page.getByText(newName)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(originalName)).not.toBeVisible();
    });

    test('should allow deleting an item', async ({ page }) => {
        const deleteName = `DeleteMe-${Date.now()}`;

        // Add item
        await page.getByPlaceholder('Item name (e.g. Milk)...').fill(deleteName);
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText(deleteName)).toBeVisible();

        // Handle confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Delete using the title
        const row = page.locator('.group').filter({ hasText: deleteName });
        await row.getByTitle('Delete Item').click();

        await expect(page.getByText(deleteName)).not.toBeVisible();
    });

    test('should reflect changes in Home page suggestions', async ({ page }) => {
        const suggestionName = `SuggestMe-${Date.now()}`;

        // 1. Add to Items Manager
        await page.getByPlaceholder('Item name (e.g. Milk)...').fill(suggestionName);
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText(suggestionName)).toBeVisible();

        // 2. Go to Home
        await page.goto('/');
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // 3. Type name and check datalist
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill(suggestionName.substring(0, 5));

        const option = page.locator(`datalist#shopping-history option[value="${suggestionName}"]`);
        await expect(option).toHaveAttribute('value', suggestionName);
    });
});
