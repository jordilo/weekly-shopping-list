"use client";

// Reuse types from use-shopping-list if possible, or define them here for independence
export interface ShoppingItem {
    id: string;
    listId: string;
    name: string;
    completed: boolean;
    category?: string;
    quantity?: string;
    createdAt: number;
}

export interface HistoryItem {
    name: string;
    category: string;
}

export interface Category {
    id: string;
    name: string;
    order: number;
}

export interface ShoppingListInfo {
    id: string;
    name: string;
    role: 'owner' | 'member';
    ownerId: string;
    createdAt: number;
    pendingCount: number;
}

export interface OfflineAction {
    id?: number;
    method: 'POST' | 'PUT' | 'DELETE';
    url: string;
    body?: Record<string, unknown>;
    timestamp: number;
}

const DB_NAME = 'shopping-list-db';
const DB_VERSION = 2;

export class OfflineDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        if (typeof window === 'undefined') return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const oldVersion = event.oldVersion;
                
                // Items store
                if (!db.objectStoreNames.contains('items')) {
                    const itemStore = db.createObjectStore('items', { keyPath: 'id' });
                    itemStore.createIndex('listId', 'listId', { unique: false });
                } else if (oldVersion < 2) {
                    // Update index if needed (though already created in v1, items might be missing the field)
                    // We don't necessarily need to recreate the index, but we can't easily populate the field here
                    // without async/await which onupgradeneeded doesn't support well for transaction logic.
                    // The next sync will fix them anyway by overwriting with full server data.
                }

                // Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    db.createObjectStore('categories', { keyPath: 'id' });
                }

                // History store
                if (!db.objectStoreNames.contains('history')) {
                    db.createObjectStore('history', { keyPath: 'name' });
                }

                // Lists store
                if (!db.objectStoreNames.contains('lists')) {
                    db.createObjectStore('lists', { keyPath: 'id' });
                }

                // Action Queue store
                if (!db.objectStoreNames.contains('actionQueue')) {
                    db.createObjectStore('actionQueue', { keyPath: 'id', autoIncrement: true });
                }

                // Meta store (for weekStartDate, etc.)
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'id' }); // id: key + listId
                }
            };
        });
    }

    private async getStore(name: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');
        const transaction = this.db.transaction(name, mode);
        return transaction.objectStore(name);
    }

    // --- Items ---
    async getItems(listId: string): Promise<ShoppingItem[]> {
        const store = await this.getStore('items');
        const index = store.index('listId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(listId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveItems(items: ShoppingItem[]): Promise<void> {
        const store = await this.getStore('items', 'readwrite');
        for (const item of items) {
            store.put(item);
        }
    }

    async deleteItem(id: string): Promise<void> {
        const store = await this.getStore('items', 'readwrite');
        store.delete(id);
    }

    async bulkReplaceItems(listId: string, serverItems: ShoppingItem[]): Promise<void> {
        const store = await this.getStore('items', 'readwrite');
        const index = store.index('listId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(listId);
            request.onsuccess = () => {
                const localItems = request.result as ShoppingItem[];
                // Delete everything for this list that is NOT a temp item
                // because we are replacing it with the server truth.
                for (const item of localItems) {
                    if (!item.id.startsWith('temp-')) {
                        store.delete(item.id);
                    }
                }
                // Save all server items
                for (const item of serverItems) {
                    store.put(item);
                }
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    // --- Categories ---
    async getCategories(): Promise<Category[]> {
        const store = await this.getStore('categories');
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async saveCategories(categories: Category[]): Promise<void> {
        const store = await this.getStore('categories', 'readwrite');
        for (const cat of categories) {
            store.put(cat);
        }
    }

    // --- History ---
    async getHistory(): Promise<HistoryItem[]> {
        const store = await this.getStore('history');
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async saveHistory(history: HistoryItem[]): Promise<void> {
        const store = await this.getStore('history', 'readwrite');
        for (const item of history) {
            store.put(item);
        }
    }

    // --- Action Queue ---
    async addAction(action: Omit<OfflineAction, 'timestamp'>): Promise<void> {
        const store = await this.getStore('actionQueue', 'readwrite');
        store.add({ ...action, timestamp: Date.now() });
    }

    async getActions(): Promise<OfflineAction[]> {
        const store = await this.getStore('actionQueue');
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async clearAction(id: number): Promise<void> {
        const store = await this.getStore('actionQueue', 'readwrite');
        store.delete(id);
    }

    async updateActionBody(
        method: string, 
        url: string, 
        matchBody: (body: Record<string, unknown>) => boolean, 
        updateBody: (body: Record<string, unknown>) => Record<string, unknown>
    ): Promise<void> {
        const store = await this.getStore('actionQueue', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    const action = cursor.value as OfflineAction;
                    if (action.method === method && action.url === url && action.body && matchBody(action.body)) {
                        const newAction = { ...action, body: updateBody(action.body) };
                        cursor.update(newAction);
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // --- Meta ---
    async getMeta(key: string, listId: string): Promise<string | number | boolean | null> {
        const store = await this.getStore('meta');
        return new Promise((resolve) => {
            const request = store.get(`${key}_${listId}`);
            request.onsuccess = () => resolve(request.result?.value ?? null);
        });
    }

    async setMeta(key: string, listId: string, value: string | number | boolean): Promise<void> {
        const store = await this.getStore('meta', 'readwrite');
        store.put({ id: `${key}_${listId}`, value });
    }

    // --- Lists ---
    async getLists(): Promise<ShoppingListInfo[]> {
        const store = await this.getStore('lists');
        return new Promise((resolve) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async saveLists(lists: ShoppingListInfo[]): Promise<void> {
        const store = await this.getStore('lists', 'readwrite');
        for (const list of lists) {
            store.put(list);
        }
    }
}

export const offlineDB = new OfflineDB();
