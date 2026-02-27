import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear local storage and reload to ensure consistent state
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        // Wait for potential initial animations or loading states
        await page.waitForTimeout(1000);
    });

    test('should match shopping list view snapshot', async ({ page }) => {
        // Add a few items for a representative snapshot
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Apples');
        await page.getByRole('button', { name: 'Add' }).click();
        await input.fill('Milk');
        await page.getByRole('button', { name: 'Add' }).click();
        
        // Wait for items to appear
        await expect(page.getByText('Apples')).toBeVisible();
        await expect(page.getByText('Milk')).toBeVisible();

        // Capture snapshot
        await expect(page).toHaveScreenshot('shopping-list-view.png', {
            mask: [page.locator('[data-testid="week-date"]')], // Mask date to avoid flakiness
        });
    });

    test('should match edit modal view snapshot', async ({ page }) => {
        // Add an item
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Bananas');
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText('Bananas')).toBeVisible();

        // Click to open modal
        await page.getByText('Bananas').click();
        
        // Wait for modal and transition
        const modal = page.locator('section[role="dialog"]');
        await expect(modal).toBeVisible();
        await page.waitForTimeout(500); // Wait for modal animation

        // Capture snapshot of the modal
        await expect(modal).toHaveScreenshot('edit-modal-view.png');
    });

    test('should match category select dropdown snapshot', async ({ page }) => {
        // Add an item and open modal
        const input = page.getByPlaceholder('Add item (e.g., Milk)');
        await input.fill('Grapes');
        await page.getByRole('button', { name: 'Add' }).click();
        await page.getByText('Grapes').click();
        
        const modal = page.locator('section[role="dialog"]');
        await expect(modal).toBeVisible();

        // Click category select to open dropdown
        // Using exact HeroUI selectors for reliability
        const selectTrigger = page.locator('button[data-slot="trigger"]');
        await selectTrigger.click();

        // Wait for options in portal (rendered at the end of body)
        const firstOption = page.locator('li[role="option"]').first();
        await expect(firstOption).toBeVisible();
        await page.waitForTimeout(500); // Wait for transition

        // Capture snapshot of the open dropdown
        // Note: Popovers are usually outside the modal in the DOM, so we capture the whole page or target the popover
        await expect(page).toHaveScreenshot('category-select-dropdown.png');
    });
});
