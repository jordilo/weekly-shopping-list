import { test, expect } from '@playwright/test';

/**
 * Tests for push notification trigger correctness and auto-refresh.
 *
 * Note: We cannot intercept the actual WebPush call to the push service from
 * Playwright (it's a server-to-service call). Instead we verify:
 *  - The API returns correct status codes for the paths that trigger notifications
 *  - The re-add path (PUT completed→false) is correctly handled
 *  - The auto-refresh polls and updates the UI without a manual refresh
 */

test.describe('Push notification triggers', () => {
    let createdItemId: string;
    let listId: string;
    const itemName = `PushTest-${Date.now()}`;

    test.beforeEach(async ({ request }) => {
        await request.post('/api/auth/test-login', {
            data: { email: 'test@example.com', name: 'Test Setup User' }
        });
        const listsRes = await request.get('/api/lists');
        const lists = await listsRes.json();
        listId = lists[0]?.id;
    });

    test.afterAll(async ({ request }) => {
        // Cleanup: delete the test item if it exists
        if (createdItemId) {
            await request.delete(`/api/items/${createdItemId}`);
        }
    });

    test('POST /api/items creates item and returns 200 (notification trigger path)', async ({ request }) => {
        const res = await request.post('/api/items', {
            data: {
                name: itemName,
                completed: false,
                category: 'Uncategorized',
                createdAt: Date.now(),
                listId,
            },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.id).toBeTruthy();
        expect(body.name).toBe(itemName);
        expect(body.completed).toBe(false);

        createdItemId = body.id;
    });

    test('PUT /api/items/:id with completed=false on completed item triggers re-add path', async ({ request }) => {
        // Create a fresh item for this test
        const reAddName = `ReAddTest-${Date.now()}`;
        const createRes = await request.post('/api/items', {
            data: { name: reAddName, completed: false, category: 'Uncategorized', createdAt: Date.now(), listId },
        });
        const created = await createRes.json();
        const id = created.id;

        // 1. Mark it as completed
        const completeRes = await request.put(`/api/items/${id}`, {
            data: { completed: true },
        });
        expect(completeRes.ok()).toBeTruthy();
        const completedItem = await completeRes.json();
        expect(completedItem.completed).toBe(true);

        // 2. Re-add: set completed back to false (this is the notification trigger)
        const reAddRes = await request.put(`/api/items/${id}`, {
            data: { completed: false },
        });
        expect(reAddRes.ok()).toBeTruthy();
        const reAddedItem = await reAddRes.json();
        expect(reAddedItem.completed).toBe(false);
        expect(reAddedItem.name).toBe(reAddName);

        // Cleanup
        await request.delete(`/api/items/${id}`);
    });

    test('PUT /api/items/:id with completed=true does NOT trigger re-add notification path', async ({ request }) => {
        // Create item
        const name = `CompleteTest-${Date.now()}`;
        const createRes = await request.post('/api/items', {
            data: { name, completed: false, category: 'Uncategorized', createdAt: Date.now(), listId },
        });
        const created = await createRes.json();
        const id = created.id;

        // Completing an item should still return 200 (just no notification)
        const completeRes = await request.put(`/api/items/${id}`, {
            data: { completed: true },
        });
        expect(completeRes.ok()).toBeTruthy();
        const item = await completeRes.json();
        expect(item.completed).toBe(true);

        // Cleanup
        await request.delete(`/api/items/${id}`);
    });
});

test.describe('Auto-refresh', () => {
    let listId: string;

    test.beforeEach(async ({ page, request }) => {
        // Authenticate the browser session (UI)
        await page.request.post('/api/auth/test-login', {
            data: { email: 'test@example.com', name: 'Test Setup User' }
        });
        
        // Authenticate the isolated request session
        await request.post('/api/auth/test-login', {
            data: { email: 'test@example.com', name: 'Test Setup User' }
        });

        const listsRes = await request.get('/api/lists');
        const lists = await listsRes.json();
        listId = lists[0]?.id;
    });

    test('list updates when poll fires (simulated via visibilitychange)', async ({ page, request }) => {
        await page.goto('/');
        await page.waitForSelector('[placeholder="Add item (e.g., Milk)"]', { timeout: 10000 });

        const uniqueName = `AutoRefresh-${Date.now()}`;

        // 1. Add item via API (simulating another device)
        const res = await request.post('/api/items', {
            data: {
                name: uniqueName,
                completed: false,
                category: 'Uncategorized',
                createdAt: Date.now(),
                listId,
            },
        });
        expect(res.ok()).toBeTruthy();
        const created = await res.json();

        // 2. Item should NOT appear immediately
        await expect(page.getByText(uniqueName)).not.toBeVisible();

        // 3. Simulate tab becoming visible (fires the visibilitychange handler → immediate poll)
        await page.evaluate(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        // 4. Item SHOULD appear quickly after the poll
        await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });

        // Cleanup
        await request.delete(`/api/items/${created.id}`);
    });

    test('list updates immediately when tab regains visibility', async ({ page, request }) => {
        await page.goto('/');
        await page.waitForSelector('[placeholder="Add item (e.g., Milk)"]', { timeout: 10000 });

        const uniqueName = `TabFocus-${Date.now()}`;

        // 1. Add item via API while tab is "away"
        const res = await request.post('/api/items', {
            data: {
                name: uniqueName,
                completed: false,
                category: 'Uncategorized',
                createdAt: Date.now(),
                listId,
            },
        });
        expect(res.ok()).toBeTruthy();
        const created = await res.json();

        // 2. Simulate switching back to the tab
        await page.evaluate(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        // 3. Item should appear quickly (visibilitychange triggers immediate poll)
        await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });

        // Cleanup
        await request.delete(`/api/items/${created.id}`);
    });
});
