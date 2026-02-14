import { useState, useEffect, useCallback } from 'react';

// --- Types ---
export interface ShoppingItem {
    id: string;
    name: string;
    completed: boolean;
    category?: string;
    createdAt: number;
}

export interface HistoryItem {
    name: string;
    category: string;
}

// --- Storage Interface (Adapter Pattern) ---
interface StorageAdapter {
    getItems: () => Promise<ShoppingItem[]>;
    addItem: (item: Omit<ShoppingItem, 'id'>) => Promise<ShoppingItem>;
    updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<ShoppingItem>;
    deleteItem: (id: string) => Promise<void>;

    getHistory: () => Promise<HistoryItem[]>;
    addToHistory: (name: string, category: string) => Promise<void>;

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
    addToHistory: async (name, category) => {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category }),
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
        await fetch('/api/items', { method: 'DELETE' });
    }
}

// --- Hook ---
export function useShoppingList() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [historySuggestions, setHistorySuggestions] = useState<HistoryItem[]>([]);
    const [weekStartDate, setWeekStartDate] = useState<number>(Date.now());
    const [isLoaded, setIsLoaded] = useState(false);

    const adapter = apiAdapter;

    const refresh = useCallback(async () => {
        setIsLoaded(false);
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
    }, []);

    // Load initial data
    useEffect(() => {
        refresh();
    }, [refresh]);

    const addItem = useCallback(async (name: string) => {
        const normalizedName = name.trim();
        // Check exact match case-insensitive
        const existing = items.find(i => i.name.toLowerCase() === normalizedName.toLowerCase());

        if (existing) {
            if (existing.completed) {
                // Reactivate
                setItems(prev => prev.map(i => i.id === existing.id ? { ...i, completed: false } : i));
                await adapter.updateItem(existing.id, { completed: false });
            }
            return;
        }

        // Auto-categorize
        const historyItem = historySuggestions.find(h => h.name.toLowerCase() === normalizedName.toLowerCase());
        const category = historyItem?.category || 'Uncategorized';

        try {
            const newItem = await adapter.addItem({
                name: normalizedName,
                completed: false,
                category,
                createdAt: Date.now(),
            });

            setItems((prev) => [newItem, ...prev]);

            // Update history if it's a new item (even default category)
            if (!historyItem) {
                await adapter.addToHistory(normalizedName, category);
                setHistorySuggestions(prev => [...prev, { name: normalizedName, category }]);
            }

        } catch (e) {
            console.error("Failed to add", e);
        }
    }, [items, historySuggestions]);

    const updateCategory = useCallback(async (id: string, newCategory: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        // Optimistic update item
        setItems(prev => prev.map(i => i.id === id ? { ...i, category: newCategory } : i));

        // Optimistic update history
        const normalizedName = item.name.trim();
        setHistorySuggestions(prev => {
            const existing = prev.find(h => h.name.toLowerCase() === normalizedName.toLowerCase());
            if (existing) {
                return prev.map(h => h.name.toLowerCase() === normalizedName.toLowerCase() ? { ...h, category: newCategory } : h);
            }
            return [...prev, { name: normalizedName, category: newCategory }];
        });

        // Async persist
        await Promise.all([
            adapter.updateItem(id, { category: newCategory }),
            adapter.addToHistory(normalizedName, newCategory)
        ]);
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
        updateCategory,
        deleteItem,
        clearCompleted,
        resetList,
        refresh,
        isLoaded
    };
}
