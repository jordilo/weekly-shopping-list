"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// --- Types ---
import { 
    offlineDB, 
    type ShoppingItem, 
    type HistoryItem, 
    type Category, 
    type ShoppingListInfo,
    type OfflineAction
} from '@/lib/offline-db';

export type { ShoppingItem, HistoryItem, Category, ShoppingListInfo, OfflineAction };

// --- Storage Interface (Adapter Pattern) ---
interface StorageAdapter {
    getItems: (listId: string) => Promise<ShoppingItem[]>;
    addItem: (item: Omit<ShoppingItem, 'id'> & { listId: string }) => Promise<ShoppingItem>;
    updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<ShoppingItem>;
    deleteItem: (id: string) => Promise<void>;

    getHistory: () => Promise<HistoryItem[]>;
    addToHistory: (name: string, category: string) => Promise<void>;

    getCategories: () => Promise<Category[]>;
    addCategory: (name: string) => Promise<Category>;
    deleteCategory: (id: string) => Promise<void>;
    deleteHistoryItem: (name: string) => Promise<void>;
    renameHistoryItem: (oldName: string, newName: string, category: string) => Promise<void>;

    getWeekStartDate: (listId: string) => Promise<number>;
    setWeekStartDate: (listId: string, date: number) => Promise<void>;

    clearItems: (listId: string) => Promise<void>;

    getLists: () => Promise<ShoppingListInfo[]>;
    getDefaultListId: () => Promise<string | null>;
}

// --- API Implementation ---
const apiAdapter: StorageAdapter = {
    getItems: async (listId: string) => {
        const res = await fetch(`/api/items?listId=${listId}`);
        if (!res.ok) return [];
        return res.json();
    },
    addItem: async (item) => {
        const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error('Failed to add item');
        return res.json();
    },
    updateItem: async (id, updates) => {
        const res = await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update item');
        return res.json();
    },
    deleteItem: async (id) => {
        await fetch(`/api/items/${id}`, { method: 'DELETE' });
    },
    getHistory: async () => {
        const res = await fetch('/api/history');
        if (!res.ok) return [];
        return res.json();
    },
    addToHistory: async (name, category) => {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category }),
        });
    },
    getCategories: async () => {
        const res = await fetch('/api/categories');
        if (!res.ok) return [];
        return res.json();
    },
    addCategory: async (name) => {
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error('Failed to add category');
        return res.json();
    },
    deleteCategory: async (id: string) => {
        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    },
    deleteHistoryItem: async (name) => {
        await fetch(`/api/history/${encodeURIComponent(name)}`, { method: 'DELETE' });
    },
    renameHistoryItem: async (oldName, newName, category) => {
        const res = await fetch(`/api/history/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newName, category }),
        });
        if (!res.ok) throw new Error('Failed to rename history item');
    },
    getWeekStartDate: async (listId: string) => {
        const res = await fetch(`/api/meta?key=weekStartDate&listId=${listId}`);
        if (!res.ok) return Date.now();
        const data = await res.json();
        return data.value ? parseInt(data.value) : Date.now();
    },
    setWeekStartDate: async (listId: string, date: number) => {
        await fetch('/api/meta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'weekStartDate', value: date, listId }),
        });
    },
    clearItems: async (listId: string) => {
        await fetch(`/api/items?listId=${listId}`, { method: 'DELETE' });
    },
    getLists: async () => {
        const res = await fetch('/api/lists');
        if (!res.ok) return [];
        return res.json();
    },
    getDefaultListId: async () => {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return null;
        const data = await res.json();
        return data.defaultListId || null;
    },
}

interface ShoppingListContextType {
    items: ShoppingItem[];
    historySuggestions: HistoryItem[];
    categories: Category[];
    weekStartDate: number;
    lists: ShoppingListInfo[];
    activeListId: string | null;
    activeList: ShoppingListInfo | null;
    setActiveListId: (id: string) => void;
    addItem: (name: string) => Promise<void>;
    toggleItem: (id: string) => Promise<void>;
    updateCategory: (id: string, newCategory: string) => Promise<void>;
    updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    clearCompleted: () => Promise<void>;
    resetList: () => Promise<void>;
    refresh: () => Promise<void>;
    refreshLists: () => Promise<ShoppingListInfo[]>;
    addCategory: (name: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    deleteHistoryItem: (name: string) => Promise<void>;
    addHistoryItem: (name: string, category: string) => Promise<void>;
    renameHistoryItem: (oldName: string, newName: string, category: string) => Promise<void>;
    isLoaded: boolean;
    isOnline: boolean;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

const LAST_LIST_KEY = 'lastSelectedListId';

export function ShoppingListProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [historySuggestions, setHistorySuggestions] = useState<HistoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [weekStartDate, setWeekStartDate] = useState<number>(Date.now());
    const [isLoaded, setIsLoaded] = useState(false);
    const [lists, setLists] = useState<ShoppingListInfo[]>([]);
    const [activeListId, setActiveListIdState] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [isSyncing, setIsSyncing] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const initRef = useRef(false);
    const pendingDeletesRef = useRef<Set<string>>(new Set());

    const adapter = apiAdapter;

    const setActiveListId = useCallback((id: string) => {
        setActiveListIdState(id);
        // Persist to localStorage
        try { localStorage.setItem(LAST_LIST_KEY, id); } catch {}
        // Update URL if on home page
        if (pathname === '/') {
            const params = new URLSearchParams(searchParams.toString());
            params.set('listId', id);
            router.replace(`/?${params.toString()}`, { scroll: false });
        }
    }, [pathname, searchParams, router]);

    const activeList = lists.find(l => l.id === activeListId) || null;

    const refreshLists = useCallback(async () => {
        try {
            const loadedLists = await adapter.getLists();
            setLists(loadedLists);
            await offlineDB.saveLists(loadedLists);
            return loadedLists;
        } catch (error) {
            console.error('Failed to load lists', error);
            // Fallback to local
            const cachedLists = await offlineDB.getLists();
            if (cachedLists.length > 0) {
                setLists(cachedLists);
                return cachedLists;
            }
            return [];
        }
    }, [adapter]);

    const refresh = useCallback(async () => {
        if (!activeListId) return;
        
        // 1. Try Cache
        try {
            const [cachedItems, cachedHistory, cachedCategories, cachedDate] = await Promise.all([
                offlineDB.getItems(activeListId),
                offlineDB.getHistory(),
                offlineDB.getCategories(),
                offlineDB.getMeta('weekStartDate', activeListId)
            ]);
            
            // If items state is currently empty AND cache has items, show them immediately.
            // If we already have items (possibly from a recent sync), we skip this to avoid jumpy UI.
            setItems(prev => {
                if (prev.length === 0 && cachedItems.length > 0) {
                    return cachedItems;
                }
                return prev;
            });

            setHistorySuggestions(cachedHistory.map(h => ({ ...h, category: h.category ?? 'Uncategorized' })));
            setCategories(cachedCategories || []);
            setWeekStartDate((cachedDate as number) || Date.now());
        } catch (e) { 
            console.error('Cache load failed', e); 
        }

        // 2. Try API (Server Truth)
        try {
            const [loadedItems, loadedHistory, loadedCategories, loadedDate, actions] = await Promise.all([
                adapter.getItems(activeListId),
                adapter.getHistory(),
                adapter.getCategories(),
                adapter.getWeekStartDate(activeListId),
                offlineDB.getActions()
            ]);
            
            // Apply pending updates (PUT) to loadedItems so the state is "intent-preserving"
            const updatedLoaded = loadedItems.map(item => {
                const pendingUpdate = actions.find(a => a.method === 'PUT' && a.url === `/api/items/${item.id}`);
                if (pendingUpdate && pendingUpdate.body) {
                    return { ...item, ...pendingUpdate.body };
                }
                return item;
            });

            setItems(prev => {
                // To avoid duplication, we combine server truth with ANY remaining local temp items
                const tempItems = prev.filter(i => i.id.startsWith('temp-'));
                
                // FILTER: Only keep updatedLoaded that aren't in pendingDeletes
                const filteredLoaded = updatedLoaded.filter(i => !pendingDeletesRef.current.has(i.id));

                const merged = [...filteredLoaded];
                for (const temp of tempItems) {
                    // Also check if there's a pending DELETE for this temp item's name
                    // although temp items are usually deleted by ID.
                    if (!filteredLoaded.some(l => l.name === temp.name)) {
                        merged.push(temp);
                    }
                }
                return merged;
            });
            
            setHistorySuggestions(loadedHistory.map(h => ({ ...h, category: h.category ?? 'Uncategorized' })));
            setCategories(loadedCategories || []);
            setWeekStartDate(loadedDate);

            // 3. Atomically Update Cache
            // We save the server truth (but filtered by pending deletes) to the cache
            await Promise.all([
                offlineDB.bulkReplaceItems(activeListId, updatedLoaded.filter(i => !pendingDeletesRef.current.has(i.id))),
                offlineDB.saveHistory(loadedHistory),
                offlineDB.saveCategories(loadedCategories),
                offlineDB.setMeta('weekStartDate', activeListId, loadedDate)
            ]);
            
            // Clean up pendingDeletes that are now "accounted for"
            for (const id of Array.from(pendingDeletesRef.current)) {
                if (updatedLoaded.every(i => i.id !== id)) {
                    pendingDeletesRef.current.delete(id);
                }
            }
        } catch (error) {
            console.error('Failed to load data from API', error);
        } finally {
            setIsLoaded(true);
        }
    }, [adapter, activeListId]);

    const syncQueue = useCallback(async () => {
        if (isSyncing || !navigator.onLine) return;
        setIsSyncing(true);
        console.log('Starting offline sync...');

        try {
            const actions = await offlineDB.getActions();
            for (const action of actions) {
                try {
                    // Skip and clear actions that were marked as deleted locally before syncing
                    if (action.body && typeof action.body === 'object' && action.body.deleted === true) {
                        if (action.id) await offlineDB.clearAction(action.id);
                        continue;
                    }

                    await fetch(action.url, {
                        method: action.method,
                        headers: { 'Content-Type': 'application/json' },
                        body: action.body ? JSON.stringify(action.body) : undefined,
                    });
                    if (action.id) await offlineDB.clearAction(action.id);
                } catch {
                    console.error('Failed to sync action', action);
                    break; // Stop on first failure to preserve order
                }
            }
            if (actions.length > 0) {
                await refresh();
            }
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, refresh]);

    // Initialize logic
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        async function init() {
            try {
                // Initialize Offline DB
                await offlineDB.init();

                // Load from cache first for instant feedback
                const [cachedLists, cachedDefaultId] = await Promise.all([
                    offlineDB.getLists(),
                    offlineDB.getMeta('defaultListId', 'global'),
                ]);

                if (cachedLists.length > 0) {
                    setLists(cachedLists);
                }

                // Priority: URL param > localStorage > API default > first list
                const urlListId = searchParams.get('listId');
                let savedListId: string | null = null;
                try { savedListId = localStorage.getItem(LAST_LIST_KEY); } catch {}

                let initialId: string | null = null;
                if (urlListId) { // Allow even if not in cache yet
                    initialId = urlListId;
                } else if (savedListId && cachedLists.some(l => l.id === savedListId)) {
                    initialId = savedListId;
                } else if (cachedDefaultId) {
                    initialId = cachedDefaultId as string;
                } else if (cachedLists.length > 0) {
                    initialId = cachedLists[0].id;
                }

                if (initialId) {
                    setActiveListIdState(initialId);
                }

                // Now fetch fresh data from API
                const [loadedLists, defaultListInfo] = await Promise.all([
                    adapter.getLists(),
                    adapter.getDefaultListId(),
                ]);
                setLists(loadedLists);
                await offlineDB.saveLists(loadedLists);
                if (defaultListInfo) await offlineDB.setMeta('defaultListId', 'global', defaultListInfo);

                // Fresh truth: URL param always highest
                // Followed by localStorage (explicit choice on this device)
                // Followed by server default (fresh account-wide preference)
                // Followed by what we decided in initial step (which might have been cached default or first list)
                const idToSet = urlListId && loadedLists.some(l => l.id === urlListId) ? urlListId 
                            : savedListId && loadedLists.some(l => l.id === savedListId) ? savedListId
                            : defaultListInfo && loadedLists.some(l => l.id === defaultListInfo) ? defaultListInfo
                            : loadedLists.some(l => l.id === initialId) ? initialId
                            : (loadedLists.length > 0 ? loadedLists[0].id : null);

                if (idToSet) {
                    setActiveListIdState(idToSet as string);
                    try { localStorage.setItem(LAST_LIST_KEY, idToSet as string); } catch {}
                    if (pathname === '/' && urlListId !== idToSet) {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('listId', idToSet as string);
                        router.replace(`/?${params.toString()}`, { scroll: false });
                    }
                }
                setIsLoaded(true);
            } catch (error) {
                console.error('Failed to initialize', error);
                setIsLoaded(true);
            }
        }
        init();
    }, [adapter, pathname, router, searchParams]);

    // Refresh items when active list changes
    useEffect(() => {
        if (activeListId) {
            refresh();
        }
    }, [activeListId, refresh]);

    // Keep active list's pendingCount in sync with items
    useEffect(() => {
        if (!activeListId) return;
        const pendingCount = items.filter(i => !i.completed).length;
        setLists(prev => prev.map(l => 
            l.id === activeListId ? { ...l, pendingCount } : l
        ));
    }, [items, activeListId]);

    // Online/Offline status and Sync Logic
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncQueue]);

    // Periodically try to sync if online
    useEffect(() => {
        const interval = setInterval(() => {
            syncQueue();
        }, 60_000);
        return () => clearInterval(interval);
    }, [syncQueue]);

    // Polling logic updated to only run when online
    useEffect(() => {
        if (!activeListId || !isOnline) return;
        const POLL_INTERVAL_MS = 30_000;

        const pollItems = async () => {
            if (document.visibilityState !== 'visible' || !navigator.onLine) return;
            try {
                const freshItems = await adapter.getItems(activeListId);
                setItems(prev => {
                    const prevJson = JSON.stringify(prev.map(i => i.id + i.completed + i.name + i.quantity + i.category));
                    const nextJson = JSON.stringify(freshItems.map((i: ShoppingItem) => i.id + i.completed + i.name + i.quantity + i.category));
                    if (prevJson !== nextJson) {
                        offlineDB.saveItems(freshItems);
                        return freshItems;
                    }
                    return prev;
                });
            } catch {
                // Silently ignore polling errors
            }
        };

        const interval = setInterval(pollItems, POLL_INTERVAL_MS);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                pollItems();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [adapter, activeListId, isOnline]);

    const toggleItem = useCallback(async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        const newCompleted = !item.completed;
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: newCompleted } : i));
        await offlineDB.saveItems([{ ...item, completed: newCompleted }]);

        if (id.startsWith('temp-')) {
            // Update the pending POST action if it exists
            await offlineDB.updateActionBody(
                'POST', 
                '/api/items', 
                (b) => b.name === item.name, 
                (b) => ({ ...b, completed: newCompleted })
            );
        } else {
            if (navigator.onLine) {
                try {
                    await adapter.updateItem(id, { completed: newCompleted });
                } catch {
                    await offlineDB.addAction({ method: 'PUT', url: `/api/items/${id}`, body: { completed: newCompleted } as Record<string, unknown> });
                }
            } else {
                await offlineDB.addAction({ method: 'PUT', url: `/api/items/${id}`, body: { completed: newCompleted } as Record<string, unknown> });
            }
        }
    }, [items, adapter]);

    const updateCategory = useCallback(async (id: string, newCategory: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        setItems(prev => prev.map(i => i.id === id ? { ...i, category: newCategory } : i));

        const normalizedName = item.name.trim();
        setHistorySuggestions(prev => {
            const existing = prev.find(h => h.name.toLowerCase() === normalizedName.toLowerCase());
            if (existing) {
                return prev.map(h => h.name.toLowerCase() === normalizedName.toLowerCase() ? { ...h, category: newCategory } : h);
            }
            return [...prev, { name: normalizedName, category: newCategory }];
        });

        if (id.startsWith('temp-')) {
            await offlineDB.updateActionBody(
                'POST', 
                '/api/items', 
                (b) => b.name === item.name, 
                (b) => ({ ...b, category: newCategory })
            );
        } else {
            await Promise.all([
                adapter.updateItem(id, { category: newCategory }),
                adapter.addToHistory(normalizedName, newCategory)
            ]);
        }
    }, [items, adapter]);

    const addItem = useCallback(async (name: string) => {
        if (!activeListId) return;

        const normalizedName = name.trim();
        const existing = items.find(i => i.name.toLowerCase() === normalizedName.toLowerCase());

        if (existing) {
            if (existing.completed) {
                toggleItem(existing.id);
            }
            return;
        }

        const historyItem = historySuggestions.find(h => h.name.toLowerCase() === normalizedName.toLowerCase());
        const category = historyItem?.category || 'Uncategorized';

        const tempId = `temp-${Date.now()}`;
        const newItem: ShoppingItem = {
            id: tempId,
            listId: activeListId,
            name: normalizedName,
            completed: false,
            category,
            createdAt: Date.now()
        };

        setItems((prev) => [newItem, ...prev]);

        if (!historyItem) {
            setHistorySuggestions(prev => [...prev, { name: normalizedName, category }]);
        }

        if (navigator.onLine) {
            try {
                const realItem = await adapter.addItem({
                    name: normalizedName,
                    completed: false,
                    category,
                    createdAt: newItem.createdAt,
                    listId: activeListId,
                });
                setItems(prev => prev.map(i => i.id === tempId ? realItem : i));
                await offlineDB.saveItems([realItem]);
                if (!historyItem) await adapter.addToHistory(normalizedName, category);
            } catch {
                console.error("Failed to add online, queueing...");
                await offlineDB.addAction({ method: 'POST', url: '/api/items', body: { name: normalizedName, completed: false, category, createdAt: newItem.createdAt, listId: activeListId } as Record<string, unknown> });
            }
        } else {
            await offlineDB.addAction({ method: 'POST', url: '/api/items', body: { name: normalizedName, completed: false, category, createdAt: newItem.createdAt, listId: activeListId } as Record<string, unknown> });
            await offlineDB.saveItems([newItem]);
        }
    }, [items, historySuggestions, adapter, activeListId, toggleItem]);

    const updateItem = useCallback(async (id: string, updates: Partial<ShoppingItem>) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

        const nameToUse = updates.name || item.name;
        const categoryToUse = updates.category || item.category || 'Uncategorized';
        
        if (updates.name || updates.category) {
            setHistorySuggestions(prev => {
                const normalizedName = nameToUse.trim();
                const existing = prev.find(h => h.name.toLowerCase() === normalizedName.toLowerCase());
                if (existing) {
                    return prev.map(h => h.name.toLowerCase() === normalizedName.toLowerCase() ? { ...h, category: categoryToUse } : h);
                }
                return [...prev, { name: normalizedName, category: categoryToUse }];
            });

            if (updates.category) {
                await adapter.addToHistory(nameToUse, updates.category);
            }
        }

        await adapter.updateItem(id, updates);
    }, [items, adapter]);

    const deleteItem = useCallback(async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        setItems((prev) => prev.filter((i) => i.id !== id));
        pendingDeletesRef.current.add(id);
        
        await offlineDB.deleteItem(id);

        if (id.startsWith('temp-')) {
            // Remove the pending POST action by marking it as deleted
            await offlineDB.updateActionBody('POST', '/api/items', (b) => b.name === item.name, (b) => ({ ...b, deleted: true }));
        }

        if (navigator.onLine && !id.startsWith('temp-')) {
            try {
                await adapter.deleteItem(id);
            } catch {
                await offlineDB.addAction({ method: 'DELETE', url: `/api/items/${id}` });
            }
        } else if (!id.startsWith('temp-')) {
            await offlineDB.addAction({ method: 'DELETE', url: `/api/items/${id}` });
        }
    }, [items, adapter]);

    const clearCompleted = useCallback(async () => {
        const completedIds = items.filter(i => i.completed).map(i => i.id);
        setItems((prev) => prev.filter((item) => !item.completed));
        await Promise.all(completedIds.map(id => adapter.deleteItem(id)));
    }, [items, adapter]);

    const resetList = useCallback(async () => {
        if (!activeListId) return;
        if (confirm("Are you sure you want to start a new week?")) {
            setItems([]);
            const newDate = Date.now();
            setWeekStartDate(newDate);

            await Promise.all([
                adapter.clearItems(activeListId),
                adapter.setWeekStartDate(activeListId, newDate)
            ]);
        }
    }, [adapter, activeListId]);

    const addCategory = useCallback(async (name: string) => {
        try {
            const newCat = await adapter.addCategory(name);
            setCategories(prev => [...prev, newCat]);
        } catch {
            alert("Failed to add category");
        }
    }, [adapter]);

    const deleteCategory = useCallback(async (id: string) => {
        try {
            setCategories(prev => prev.filter(c => c.id !== id));
            await adapter.deleteCategory(id);
        } catch {
            alert("Failed to delete category");
        }
    }, [adapter]);

    const deleteHistoryItem = useCallback(async (name: string) => {
        try {
            setHistorySuggestions(prev => prev.filter(h => h.name !== name));
            await adapter.deleteHistoryItem(name);
        } catch {
            alert("Failed to delete item from history");
        }
    }, [adapter]);

    const addHistoryItem = useCallback(async (name: string, category: string) => {
        try {
            await adapter.addToHistory(name, category);
            setHistorySuggestions(prev => {
                const existing = prev.find(h => h.name.toLowerCase() === name.toLowerCase());
                if (existing) {
                    return prev.map(h => h.name.toLowerCase() === name.toLowerCase() ? { ...h, category } : h);
                }
                return [...prev, { name, category }];
            });
        } catch {
            alert("Failed to save history item");
        }
    }, [adapter]);

    const renameHistoryItem = useCallback(async (oldName: string, newName: string, category: string) => {
        try {
            setHistorySuggestions(prev => prev.map(h => h.name === oldName ? { ...h, name: newName, category } : h));
            await adapter.renameHistoryItem(oldName, newName, category);
        } catch {
            alert("Failed to rename item");
            refresh();
        }
    }, [adapter, refresh]);

    const value = {
        items,
        historySuggestions,
        categories,
        weekStartDate,
        lists,
        activeListId,
        activeList,
        setActiveListId,
        addItem,
        toggleItem,
        updateCategory,
        updateItem,
        deleteItem,
        clearCompleted,
        resetList,
        refresh,
        refreshLists,
        addCategory,
        deleteCategory,
        deleteHistoryItem,
        addHistoryItem,
        renameHistoryItem,
        isLoaded,
        isOnline
    }

    return (
        <ShoppingListContext.Provider value={value}>
            {children}
        </ShoppingListContext.Provider>
    );
}

export function useShoppingList() {
    const context = useContext(ShoppingListContext);
    if (context === undefined) {
        throw new Error('useShoppingList must be used within a ShoppingListProvider');
    }
    return context;
}