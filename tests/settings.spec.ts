import { test, expect } from '@playwright/test';

test.describe('Settings and Theme', () => {
    test.beforeEach(async ({ page }) => {
        await page.request.post('/api/auth/test-login', {
            data: { email: 'test@example.com', name: 'Test Setup User' }
        });
        await page.goto('/settings');
        // Wait for hydration (important for next-themes)
        await page.waitForTimeout(500); 
    });

    test('should allow switching themes and verify contrast', async ({ page }) => {
        const html = page.locator('html');
        
        // --- 1. System Default ---
        // Verify radio "System" is checked by default (or exists)
        await expect(page.locator('label:has-text("System") input')).toBeAttached();

        // --- 2. Switch to Dark ---
        await page.locator('label:has-text("Dark")').click();
        await expect(html).toHaveClass(/dark/);
        await page.waitForTimeout(200); // Wait for theme to apply to styles
        
        // Verify the title in the standardized header
        const headerTitle = page.locator('header h1');
        await expect(headerTitle).toHaveText('Settings');
        
        // --- 3. Switch to Light ---
        await page.locator('label:has-text("Light")').click();
        await expect(html).not.toHaveClass(/dark/);
        
        await expect(headerTitle).toHaveText('Settings');
        
        // --- 4. Verify LocalStorage Persistence ---
        const themeValue = await page.evaluate(() => localStorage.getItem('theme'));
        expect(themeValue).toBe('light'); // We just switched to light
        
        // Reload page to ensure persistence
        await page.reload();
        await page.waitForTimeout(500);
        await expect(html).not.toHaveClass(/dark/);
    });
});
