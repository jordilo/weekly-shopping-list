import { test, expect } from '@playwright/test';

test.describe('Drag and Drop Reordering', () => {
    test.beforeEach(async ({ page }) => {
        // Clear local storage
        await page.addInitScript(() => {
            window.localStorage.clear();
        });
    });
        
    test('should reorder items within a category', async ({ page }) => {
        const uniqueEmail = `drag-items-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        const res = await page.request.post('/api/auth/test-login', {
            data: { email: uniqueEmail, name: 'Dragger Items' }
        });
        expect(res.ok()).toBeTruthy();
        await page.goto('/');
        await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 15000 });

        // 1. Add two items
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        
        await input.fill('Item A');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Item A')).toBeVisible();

        await input.fill('Item B');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Item B')).toBeVisible();

        // 2. Perform reorder using Keyboard (more reliable for dnd-kit in tests)
        const handleA = page.locator('[data-testid^="drag-handle-"]').nth(0);
        
        await handleA.focus();
        await page.keyboard.press(' ');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await page.keyboard.press(' ');
        
        // 3. Verify order changed
        await page.waitForTimeout(1000);
        
        // Get the names in order
        const itemNames = await page.locator('span.text-base.font-semibold').allTextContents();
        // Item A should now be after Item B (or at least not first if we have more items)
        expect(itemNames[1]).toBe('Item A');
    });

    test('should reorder lists in the lists page', async ({ page }) => {
        const uniqueEmail = `drag-lists-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
        await page.request.post('/api/auth/test-login', {
            data: { email: uniqueEmail, name: 'Dragger Lists' }
        });
        
        await page.goto('/lists', { waitUntil: 'load', timeout: 60000 });
        await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 20000 });

        // 1. Create a second list (one already exists as default)
        const nameInput = page.getByPlaceholder('List name...');
        await nameInput.fill('List 2');
        await page.getByRole('button', { name: 'Create' }).click();
        
        await expect(page.getByText('List 2')).toBeVisible();
        
        // 2. Drag reorder using Keyboard
        const handle1 = page.locator('[data-testid^="drag-handle-"]').nth(0);
        
        await handle1.focus();
        await page.keyboard.press(' ');
        await page.waitForTimeout(200);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await page.keyboard.press(' ');

        await page.waitForTimeout(1000);

        // Verify order changed by checking the list name in the index 1 position
        // The list names are in Link components within ListRow
        const listNames = await page.locator('a h3').allTextContents();
        // Since 'List 2' was added last and 'My Shopping List' was first,
        // reordering 'My Shopping List' down should put 'List 2' at index 0 and 'My Shopping List' at index 1
        expect(listNames[1]).toBe('My Shopping List');
    });
});
