import { useState, useEffect, useCallback } from 'react';

// --- Types ---
export interface ShoppingItem {
    id: string;
    name: string;
    completed: boolean;
    category?: string;
    createdAt: number;
}

// --- Storage Interface (Adapter Pattern) ---
interface StorageAdapter {
    getItems: () => Promise<ShoppingItem[]>;
    addItem: (item: Omit<ShoppingItem, 'id'>) => Promise<ShoppingItem>;
    updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<ShoppingItem>;
    deleteItem: (id: string) => Promise<void>;

    getHistory: () => Promise<string[]>;
    addToHistory: (name: string) => Promise<void>;

    getWeekStartDate: () => Promise<number>;
    setWeekStartDate: (date: number) => Promise<void>;

    clearItems: () => Promise<void>;
}

// --- API Implementation ---
const apiAdapter: StorageAdapter = {
    getItems: async () => {
        const res = await fetch('/api/items');
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
    addToHistory: async (name) => {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
    },
    getWeekStartDate: async () => {
        const res = await fetch('/api/meta?key=weekStartDate');
        if (!res.ok) return Date.now();
        const data = await res.json();
        return data.value ? parseInt(data.value) : Date.now();
    },
    setWeekStartDate: async (date) => {
        await fetch('/api/meta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'weekStartDate', value: date }),
        });
    },
    clearItems: async () => {
        // We need a clear endpoint or loop delete. ideally bulk delete
        // Using the base DELETE on /api/items to clear all
        await fetch('/api/items', { method: 'DELETE' });
    }
}

// --- Hook ---
export function useShoppingList() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [historySuggestions, setHistorySuggestions] = useState<string[]>([]);
    const [weekStartDate, setWeekStartDate] = useState<number>(Date.now());
    const [isLoaded, setIsLoaded] = useState(false);

    const adapter = apiAdapter;

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [loadedItems, loadedHistory, loadedDate] = await Promise.all([
                    adapter.getItems(),
                    adapter.getHistory(),
                    adapter.getWeekStartDate()
                ]);
                setItems(loadedItems);
                setHistorySuggestions(loadedHistory);
                setWeekStartDate(loadedDate);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    const addItem = useCallback(async (name: string, category?: string) => {
        const normalizedName = name.trim();

        // Optimistic UI update check
        const existing = items.find(i => i.name.toLowerCase() === normalizedName.toLowerCase());
        if (existing) {
            if (existing.completed) {
                // Reactivate
                setItems(prev => prev.map(i => i.id === existing.id ? { ...i, completed: false } : i));
                await adapter.updateItem(existing.id, { completed: false });
            }
            return;
        }

        // Optimistic add (with temp ID) or wait for server?
        // Let's wait for server to get real ID to avoid complexity
        try {
            const newItem = await adapter.addItem({
                name: normalizedName,
                completed: false,
                category,
                createdAt: Date.now(),
            });

            setItems((prev) => [newItem, ...prev]);

            // Update history
            await adapter.addToHistory(name);
            // Refresh local suggestion state - could rely on local append but let's re-fetch or append
            setHistorySuggestions(prev => {
                if (!prev.includes(normalizedName)) return [...prev, normalizedName].sort();
                return prev;
            });

        } catch (e) {
            console.error("Failed to add", e);
        }
    }, [items]);

    const toggleItem = useCallback(async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        // Optimistic
        setItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, completed: !i.completed } : i
            )
        );

        await adapter.updateItem(id, { completed: !item.completed });
    }, [items]);

    const deleteItem = useCallback(async (id: string) => {
        // Optimistic
        setItems((prev) => prev.filter((item) => item.id !== id));
        await adapter.deleteItem(id);
    }, []);

    const clearCompleted = useCallback(async () => {
        const completedIds = items.filter(i => i.completed).map(i => i.id);
        // Optimistic
        setItems((prev) => prev.filter((item) => !item.completed));

        // Parallel delete
        await Promise.all(completedIds.map(id => adapter.deleteItem(id)));
    }, [items]);

    const resetList = useCallback(async () => {
        if (confirm("Are you sure you want to start a new week?")) {
            setItems([]);
            const newDate = Date.now();
            setWeekStartDate(newDate);

            await Promise.all([
                adapter.clearItems(),
                adapter.setWeekStartDate(newDate)
            ]);
        }
    }, []);

    return {
        items,
        historySuggestions,
        weekStartDate,
        addItem,
        toggleItem,
        deleteItem,
        clearCompleted,
        resetList,
        isLoaded
    };
}
