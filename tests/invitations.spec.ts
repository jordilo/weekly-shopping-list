import { test, expect } from '@playwright/test';

test.describe('Invitations & Subscriptions', () => {

    test('end to end sharing flow', async ({ browser }) => {
        // Create two isolated browser contexts to simulate two users
        const ctxA = await browser.newContext();
        const ctxB = await browser.newContext();

        const pageA = await ctxA.newPage();
        const pageB = await ctxB.newPage();

        const salt = Math.random().toString(36).substring(7);
        const userAEmail = `userA_${Date.now()}_${salt}@example.com`;
        const userBEmail = `userB_${Date.now()}_${salt}@example.com`;

        // 1. Authenticate User A and B
        await pageA.request.post('/api/auth/test-login', {
            data: { email: userAEmail, name: 'User A' }
        });
        await pageB.request.post('/api/auth/test-login', {
            data: { email: userBEmail, name: 'User B' }
        });

        // 2. User A creates a list to share
        await pageA.goto('/lists');
        const sharedListName = `Shared List ${Date.now()}`;
        await pageA.fill('[data-testid="new-list-input"]', sharedListName);
        
        // Wait for both the creation POST and the subsequent list refresh GET
        const createPromise = pageA.waitForResponse(resp => 
            resp.url().includes('/api/lists') && resp.request().method() === 'POST' && resp.status() === 200
        );
        const refreshPromiseA = pageA.waitForResponse(resp => 
            resp.url().includes('/api/lists') && resp.request().method() === 'GET' && resp.status() === 200
        );
        
        await pageA.click('button:has-text("Create")');
        await Promise.all([createPromise, refreshPromiseA]);
        
        // Use a more specific locator and wait longer if needed
        const listLocator = pageA.locator('[data-testid="my-lists-card"]').locator('text=' + sharedListName);
        await expect(listLocator).toBeVisible({ timeout: 10000 });

        // Navigate to settings of the newly created list
        const listRowA = pageA.locator('.flex.items-center.p-4.px-6').filter({ hasText: sharedListName });
        await listRowA.locator('a[title="List settings"]').click();
        await expect(pageA).toHaveURL(/.*\/settings$/);

        // 3. User A invites User B
        await pageA.fill('[data-testid="invite-input"]', userBEmail);
        const invitePromise = pageA.waitForResponse(resp => resp.url().includes('/api/lists/') && resp.url().includes('/invite') && resp.status() === 200);
        await pageA.locator('button', { hasText: /^Invite$/ }).click();
        await invitePromise;
        
        // Invitation should appear in pending list
        await expect(pageA.locator('[data-testid="pending-invites-card"]')).toBeVisible({ timeout: 10000 });

        // 4. User B accepts the invitation
        await pageB.goto('/settings');
        // Pending invitation should be visible
        await expect(pageB.locator('text=' + sharedListName)).toBeVisible();
        
        // Click Accept
        const acceptPromise = pageB.waitForResponse(resp => resp.url().includes('/api/invitations/') && resp.request().method() === 'PUT' && resp.status() === 200);
        await pageB.locator('button[title="Accept"]').click();
        await acceptPromise;
        
        // Wait for it to disappear from Pending and appear in Subscriptions
        await expect(pageB.locator('[data-testid="pending-invites-card"]', { hasText: sharedListName })).not.toBeVisible();
        await expect(pageB.locator('[data-testid="subscriptions-card"]', { hasText: sharedListName })).toBeVisible();

        // 5. User A verifies User B is a member
        // User A needs to reload to see the membership change if there's no real-time sync
        await pageA.reload();
        await expect(pageA.locator('[data-testid="invite-card"]')).toContainText(userBEmail);

        // 6. User B unsubscribes
        pageB.on('dialog', dialog => dialog.accept());
        const refreshPromise = pageB.waitForResponse(resp => resp.url().includes('/api/lists') && resp.status() === 200);
        await pageB.locator('button[title="Unsubscribe"]').first().click();
        await refreshPromise;

        await expect(pageB.locator('[data-testid="subscriptions-card"]', { hasText: sharedListName })).not.toBeVisible();

        // 7. Cleanup contexts
        await ctxA.close();
        await ctxB.close();
    });
});
