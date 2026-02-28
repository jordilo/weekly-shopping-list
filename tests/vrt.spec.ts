import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing', () => {
    test.beforeEach(async ({ page }) => {
        // Mock API responses for stable VRT snapshots
        await page.route('/api/items', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [
                        { id: '1', name: 'Apples', category: 'Produce', completed: false, createdAt: 1000 },
                        { id: '2', name: 'Milk', category: 'Dairy', completed: false, quantity: '1 gallon', createdAt: 2000 },
                        { id: '3', name: 'Bread', category: 'Bakery', completed: true, createdAt: 3000 }
                    ]
                });
            } else {
                await route.fulfill({ json: { success: true } });
            }
        });

        await page.route('/api/categories', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [
                        { name: 'Produce', color: '#ff0000', order: 0 },
                        { name: 'Dairy', color: '#00ff00', order: 1 },
                        { name: 'Bakery', color: '#0000ff', order: 2 }
                    ]
                });
            } else {
                await route.fulfill({ json: { success: true } });
            }
        });

        await page.route('/api/history', async (route) => {
            await route.fulfill({
                json: [
                    { name: 'Apples', category: 'Produce' },
                    { name: 'Milk', category: 'Dairy' },
                    { name: 'Bread', category: 'Bakery' }
                ]
            });
        });

        await page.route('/api/meta', async (route) => {
            await route.fulfill({
                json: { weekStartDate: '2026-02-23' }
            });
        });

        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        // Wait for potential initial animations or loading states
        await page.waitForTimeout(1000);
    });

    test('should match shopping list view snapshot', async ({ page }) => {
        // Wait for static mock items to appear
        await expect(page.getByText('Apples')).toBeVisible();
        await expect(page.getByText('Milk')).toBeVisible();

        // Capture snapshot
        await expect(page).toHaveScreenshot('shopping-list-view.png', {
            mask: [page.locator('[data-testid="week-date"]')], // Mask date to avoid flakiness
        });
    });

    test('should match edit modal view snapshot', async ({ page }) => {
        // Mock items already exist, just click one
        await expect(page.getByText('Apples')).toBeVisible();

        // Click to open modal
        await page.getByText('Apples').click();
        
        // Wait for modal and transition
        const modal = page.locator('section[role="dialog"]');
        await expect(modal).toBeVisible();
        await page.waitForTimeout(500); // Wait for modal animation

        // Capture snapshot of the modal
        await expect(modal).toHaveScreenshot('edit-modal-view.png');
    });

    test('should match category select dropdown snapshot', async ({ page }) => {
        // Mock items already exist, open modal
        await expect(page.getByText('Apples')).toBeVisible();
        await page.getByText('Apples').click();
        
        const modal = page.locator('section[role="dialog"]');
        await expect(modal).toBeVisible();

        // Click category select to open dropdown
        // Using exact HeroUI selectors for reliability
        const selectTrigger = page.getByRole('button', { name: 'Produce' });
        await selectTrigger.click();

        // Wait for options in portal (rendered at the end of body)
        const firstOption = page.locator('li[role="option"]').first();
        await expect(firstOption).toBeVisible();
        await page.waitForTimeout(500); // Wait for transition

        // Capture snapshot of the open dropdown
        // Note: Popovers are usually outside the modal in the DOM, so we capture the whole page or target the popover
        await expect(page).toHaveScreenshot('category-select-dropdown.png');
    });

    test('should match categories management page snapshot', async ({ page }) => {
        await page.goto('/categories');
        await expect(page.getByRole('heading', { name: 'Manage Categories' })).toBeVisible();
        await expect(page).toHaveScreenshot('categories-management-page.png');
    });

    test('should match items management page snapshot', async ({ page }) => {
        await page.goto('/items');
        await expect(page.getByRole('heading', { name: 'Manage Items' })).toBeVisible();
        await expect(page).toHaveScreenshot('items-management-page.png');
    });

    test('should match items manager dropdown snapshot', async ({ page }) => {
        await page.goto('/items');
        
        // Open the category select in the "Add New Master Item" form
        const searchInput = page.getByPlaceholder('Item name (e.g. Milk)...');
        await expect(searchInput).toBeVisible();

        const selectTrigger = page.locator('button[data-slot="trigger"]').first();
        await selectTrigger.click();

        // Wait for options in portal
        const firstOption = page.locator('li[role="option"]').first();
        await expect(firstOption).toBeVisible();
        await page.waitForTimeout(500); // Wait for transition

        await expect(page).toHaveScreenshot('items-manager-category-dropdown.png');
    });
});
