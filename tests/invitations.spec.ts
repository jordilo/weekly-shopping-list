import { test, expect } from '@playwright/test';

test.describe('Invitations & Subscriptions', () => {

    test('end to end sharing flow', async ({ browser }) => {
        // Create two isolated browser contexts to simulate two users
        const ctxA = await browser.newContext();
        const ctxB = await browser.newContext();

        const pageA = await ctxA.newPage();
        const pageB = await ctxB.newPage();

        const userAEmail = `userA_${Date.now()}@example.com`;
        const userBEmail = `userB_${Date.now()}@example.com`;

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
        await pageA.click('button:has-text("Create")');
        await expect(pageA.locator('text=' + sharedListName)).toBeVisible();

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
        await pageB.locator('button[title="Accept"]').click();
        
        // Wait for it to disappear from Pending and appear in Subscriptions
        await expect(pageB.locator('[data-testid="pending-invites-card"]', { hasText: sharedListName })).not.toBeVisible();
        await expect(pageB.locator('[data-testid="subscriptions-card"]', { hasText: sharedListName })).toBeVisible();

        // 5. User A verifies User B is a member
        await pageA.reload();
        await expect(pageA.locator('text=' + userBEmail)).toBeVisible();

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
