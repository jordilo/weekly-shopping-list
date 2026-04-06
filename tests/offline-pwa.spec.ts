import { test, expect } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Authenticate
        await page.request.post('/api/auth/test-login', {
            data: { email: 'offline-tester@example.com', name: 'Offline Tester' }
        });

        // 2. Load the app while online to register SW and cache assets
        await page.goto('/');
        await expect(page.getByText('Loading...')).not.toBeVisible();
        
        // Wait for Service Worker to be ready
        await page.evaluate(async () => {
            const registration = await navigator.serviceWorker.ready;
            return !!registration;
        });

        // Ensure we are in a clean state (clear IndexedDB and localStorage)
        await page.evaluate(async () => {
            localStorage.clear();
            const dbs = await window.indexedDB.databases();
            for (const dbInfo of dbs) {
                if (dbInfo.name) window.indexedDB.deleteDatabase(dbInfo.name);
            }
        });
        await page.reload();
        await expect(page.getByText('Loading...')).not.toBeVisible();
    });

    test.afterEach(async ({ page, context }) => {
        // Go back online
        await context.setOffline(false);
    });

    test('should load the app shell while offline', async ({ page, context }) => {
        // Ensure static assets are cached by visiting once
        await page.goto('/');
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // 1. Go Offline
        await context.setOffline(true);

        // 2. Reload the page (should load from Service Worker)
        await page.reload();

        // 3. Verify UI shell is visible
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('nav')).toBeVisible(); // Bottom Navbar
        
        // The list might be empty but the "Add item" input should be there
        await expect(page.getByPlaceholder(/Add item/i)).toBeVisible();
    });

    test('should allow adding items offline and sync when online', async ({ page, context }) => {
        const offlineItemName = `Offline-Item-${Date.now()}`;

        // 1. Go Offline
        await context.setOffline(true);

        // 2. Add an item while offline
        const input = page.getByPlaceholder(/Add item/i);
        await input.fill(offlineItemName);
        await page.getByRole('button', { name: 'Add' }).click();

        // 3. Verify it's visible (optimistic update from IndexedDB)
        await expect(page.getByText(offlineItemName)).toBeVisible();

        // 4. Reload page while still offline
        await page.reload();
        await expect(page.getByText('Loading...')).not.toBeVisible();
        
        // Verify it persists after reload (from IndexedDB)
        await expect(page.getByText(offlineItemName)).toBeVisible();

        // 5. Go Online
        await context.setOffline(false);

        // 6. Wait for sync - wait for action queue to be empty
        await page.evaluate(async () => {
            const getQueueSize = async () => {
                // We need to access the store to check
                const dbName = 'shopping-list-db';
                return new Promise((resolve) => {
                    const request = indexedDB.open(dbName);
                    request.onsuccess = () => {
                        const db = request.result;
                        const tx = db.transaction('actionQueue', 'readonly');
                        const store = tx.objectStore('actionQueue');
                        const countReq = store.count();
                        countReq.onsuccess = () => resolve(countReq.result);
                    };
                });
            };
            
            // Poll until empty
            for (let i = 0; i < 20; i++) {
                const count = await getQueueSize();
                if (count === 0) return true;
                await new Promise(r => setTimeout(r, 500));
            }
            throw new Error('Action queue did not clear in time');
        });

        // Final Verification - reloading to pull fresh from server
        await page.reload();
        await expect(page.getByText('Loading...')).not.toBeVisible();

        // 7. Final verification - the item should still be there (now fetched from server)
        await expect(page.getByText(offlineItemName)).toBeVisible();
    });

    test('should preserve item toggle state while offline and sync it', async ({ page, context }) => {
        // 1. Add an item while online
        const itemName = `Sync-Toggle-${Date.now()}`;
        await page.getByPlaceholder(/Add item/i).fill(itemName);
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText(itemName)).toBeVisible();

        // Wait for the online POST to complete and settle the item ID
        await page.waitForTimeout(1000);

        // 2. Go Offline
        await context.setOffline(true);

        // 3. Toggle the item
        const itemRow = page.locator('#shopping-list-main .group', { hasText: itemName });
        const checkbox = itemRow.locator('button').filter({ has: page.locator('svg') });
        await checkbox.click();

        // 4. Verify it has the line-through class
        await expect(itemRow.getByText(itemName)).toHaveClass(/line-through/);

        // 5. Reload offline and verify state persists
        await page.reload();
        await expect(page.getByText('Loading...')).not.toBeVisible();
        await expect(page.locator('#shopping-list-main .group', { hasText: itemName }).getByText(itemName)).toHaveClass(/line-through/, { timeout: 10000 });
        console.log('BROWSER LOG: Finished reloading offline');

        // 6. Go Online and wait for sync
        await context.setOffline(false);
        
        // Wait for action queue to be empty (more robust than hard timeout)
        await page.evaluate(async () => {
            const dbName = 'shopping-list-db';
            for (let i = 0; i < 20; i++) {
                const count = await new Promise<number>((resolve) => {
                    const request = indexedDB.open(dbName);
                    request.onsuccess = () => {
                        const db = request.result;
                        if (!db.objectStoreNames.contains('actionQueue')) { resolve(0); return; }
                        const tx = db.transaction('actionQueue', 'readonly');
                        const store = tx.objectStore('actionQueue');
                        const countReq = store.count();
                        countReq.onsuccess = () => resolve(countReq.result);
                    };
                });
                if (count === 0) return true;
                await new Promise(r => setTimeout(r, 500));
            }
            throw new Error('Action queue did not clear in time');
        });
        
        // 7. Reload and verify sync was successful
        await page.reload();
        // Final verification - use scoped locator to avoid strict mode violations
        const finalItemRow = page.locator('#shopping-list-main .group', { hasText: itemName });
        try {
             await expect(finalItemRow.getByText(itemName)).toHaveClass(/line-through/, { timeout: 10000 });
        } catch (error) {
             await page.screenshot({ path: `failure-${Date.now()}.png`, fullPage: true });
             throw error;
        }
    });
});
