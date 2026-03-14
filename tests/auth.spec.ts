import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test('unauthenticated users are redirected to login', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('login page renders correctly', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('text=Sign in with Google')).toBeVisible();
    });

    test('test-login bypass works and allows logout', async ({ page }) => {
        // Use test-login API to simulate login
        const response = await page.request.post('/api/auth/test-login', {
            data: {
                email: 'test@example.com',
                name: 'Test Setup User'
            }
        });
        expect(response.ok()).toBeTruthy();

        // Go to home, should be allowed now
        await page.goto('/');
        await expect(page).not.toHaveURL(/.*\/login/);

        // Verify user is rendered in some way (e.g., settings page)
        await page.goto('/settings');
        await expect(page.locator('text=Test Setup User')).toBeVisible();

        // Logout
        await page.locator('text=Sign Out').click();
        
        // Should be redirected to login
        await expect(page).toHaveURL(/.*\/login/);
    });
});
