"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

// --- Types ---
export interface ShoppingItem {
    id: string;
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
}

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
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export function ShoppingListProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [historySuggestions, setHistorySuggestions] = useState<HistoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [weekStartDate, setWeekStartDate] = useState<number>(Date.now());
    const [isLoaded, setIsLoaded] = useState(false);
    const [lists, setLists] = useState<ShoppingListInfo[]>([]);
    const [activeListId, setActiveListIdState] = useState<string | null>(null);

    const adapter = apiAdapter;

    const setActiveListId = useCallback((id: string) => {
        setActiveListIdState(id);
    }, []);

    const activeList = lists.find(l => l.id === activeListId) || null;

    const refreshLists = useCallback(async () => {
        try {
            const loadedLists = await adapter.getLists();
            setLists(loadedLists);
            return loadedLists;
        } catch (error) {
            console.error('Failed to load lists', error);
            return [];
        }
    }, [adapter]);

    // Load lists and set active list on mount
    useEffect(() => {
        async function init() {
            try {
                const [loadedLists, defaultListId] = await Promise.all([
                    adapter.getLists(),
                    adapter.getDefaultListId(),
                ]);
                setLists(loadedLists);

                if (defaultListId && loadedLists.some(l => l.id === defaultListId)) {
                    setActiveListIdState(defaultListId);
                } else if (loadedLists.length > 0) {
                    setActiveListIdState(loadedLists[0].id);
                }
            } catch (error) {
                console.error('Failed to initialize', error);
            }
        }
        init();
    }, [adapter]);

    const refresh = useCallback(async () => {
        if (!activeListId) return;
        setIsLoaded(false);
        try {
            const [loadedItems, loadedHistory, loadedCategories, loadedDate] = await Promise.all([
                adapter.getItems(activeListId),
                adapter.getHistory(),
                adapter.getCategories(),
                adapter.getWeekStartDate(activeListId)
            ]);
            setItems(loadedItems);
            setHistorySuggestions(loadedHistory.map(h => ({ ...h, category: h.category ?? 'Uncategorized' })));
            setCategories(loadedCategories || []);
            setWeekStartDate(loadedDate);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoaded(true);
        }
    }, [adapter, activeListId]);

    // Refresh items when active list changes
    useEffect(() => {
        if (activeListId) {
            refresh();
        }
    }, [activeListId, refresh]);

    // Auto-refresh: poll every 30 seconds when the tab is visible,
    // and trigger an immediate refresh when the tab regains focus.
    useEffect(() => {
        if (!activeListId) return;
        const POLL_INTERVAL_MS = 30_000;

        const pollItems = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const freshItems = await adapter.getItems(activeListId);
                setItems(prev => {
                    const prevJson = JSON.stringify(prev.map(i => i.id + i.completed + i.name + i.quantity + i.category));
                    const nextJson = JSON.stringify(freshItems.map((i: ShoppingItem) => i.id + i.completed + i.name + i.quantity + i.category));
                    return prevJson === nextJson ? prev : freshItems;
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
    }, [adapter, activeListId]);


    // Auto-refresh: poll every 30 seconds when the tab is visible,
    // and trigger an immediate refresh when the tab regains focus.
    useEffect(() => {
        const POLL_INTERVAL_MS = 30_000;

        const pollItems = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const freshItems = await adapter.getItems();
                setItems(prev => {
                    // Only update if data actually changed (avoid unnecessary re-renders)
                    const prevJson = JSON.stringify(prev.map(i => i.id + i.completed + i.name + i.quantity + i.category));
                    const nextJson = JSON.stringify(freshItems.map((i: ShoppingItem) => i.id + i.completed + i.name + i.quantity + i.category));
                    return prevJson === nextJson ? prev : freshItems;
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
    }, [adapter]);

    const addItem = useCallback(async (name: string) => {
        if (!activeListId) return;

        const normalizedName = name.trim();
        const existing = items.find(i => i.name.toLowerCase() === normalizedName.toLowerCase());

        if (existing) {
            if (existing.completed) {
                setItems(prev => prev.map(i => i.id === existing.id ? { ...i, completed: false } : i));
                await adapter.updateItem(existing.id, { completed: false });
            }
            return;
        }

        const historyItem = historySuggestions.find(h => h.name.toLowerCase() === normalizedName.toLowerCase());
        const category = historyItem?.category || 'Uncategorized';

        try {
            const newItem = await adapter.addItem({
                name: normalizedName,
                completed: false,
                category,
                createdAt: Date.now(),
                listId: activeListId,
            });

            setItems((prev) => [newItem, ...prev]);

            if (!historyItem) {
                await adapter.addToHistory(normalizedName, category);
                setHistorySuggestions(prev => [...prev, { name: normalizedName, category }]);
            }

        } catch (e) {
            console.error("Failed to add", e);
        }
    }, [items, historySuggestions, adapter, activeListId]);

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

        await Promise.all([
            adapter.updateItem(id, { category: newCategory }),
            adapter.addToHistory(normalizedName, newCategory)
        ]);
    }, [items, adapter]);

    const toggleItem = useCallback(async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        setItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, completed: !i.completed } : i
            )
        );

        await adapter.updateItem(id, { completed: !item.completed });
    }, [items, adapter]);

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
        setItems((prev) => prev.filter((item) => item.id !== id));
        await adapter.deleteItem(id);
    }, [adapter]);

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
        } catch (e) {
            console.error(e);
            alert("Failed to add category");
        }
    }, [adapter]);

    const deleteCategory = useCallback(async (id: string) => {
        try {
            setCategories(prev => prev.filter(c => c.id !== id));
            await adapter.deleteCategory(id);
        } catch (e) {
            console.error(e);
            alert("Failed to delete category");
        }
    }, [adapter]);

    const deleteHistoryItem = useCallback(async (name: string) => {
        try {
            setHistorySuggestions(prev => prev.filter(h => h.name !== name));
            await adapter.deleteHistoryItem(name);
        } catch (e) {
            console.error(e);
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
        } catch (e) {
            console.error(e);
            alert("Failed to save history item");
        }
    }, [adapter]);

    const renameHistoryItem = useCallback(async (oldName: string, newName: string, category: string) => {
        try {
            setHistorySuggestions(prev => prev.map(h => h.name === oldName ? { ...h, name: newName, category } : h));
            await adapter.renameHistoryItem(oldName, newName, category);
        } catch (e) {
            console.error(e);
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
        isLoaded
    }

    return <ShoppingListContext.Provider
        value={value}>
        {children}
    </ShoppingListContext.Provider>

}

export function useShoppingList() {
    const context = useContext(ShoppingListContext);
    if (context === undefined) {
        throw new Error('useShoppingList must be used within a ShoppingListProvider');
    }
    return context;
}