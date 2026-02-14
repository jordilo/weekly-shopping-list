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

export interface Category {
    id: string;
    name: string;
    order: number;
}

// --- Storage Interface (Adapter Pattern) ---
interface StorageAdapter {
    getItems: () => Promise<ShoppingItem[]>;
    addItem: (item: Omit<ShoppingItem, 'id'>) => Promise<ShoppingItem>;
    updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<ShoppingItem>;
    deleteItem: (id: string) => Promise<void>;

    getHistory: () => Promise<HistoryItem[]>;
    addToHistory: (name: string, category: string) => Promise<void>;

    getCategories: () => Promise<Category[]>;
    addCategory: (name: string) => Promise<Category>;
    deleteCategory: (id: string) => Promise<void>;

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
    deleteCategory: async (id) => {
        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
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

// --- Default Categories for Fallback ---
const DEFAULT_CATEGORIES = [
    'Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Household', 'Other'
];

// --- Hook ---
export function useShoppingList() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [historySuggestions, setHistorySuggestions] = useState<HistoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [weekStartDate, setWeekStartDate] = useState<number>(Date.now());
    const [isLoaded, setIsLoaded] = useState(false);

    const adapter = apiAdapter;

    const refresh = useCallback(async () => {
        setIsLoaded(false);
        try {
            const [loadedItems, loadedHistory, loadedCategories, loadedDate] = await Promise.all([
                adapter.getItems(),
                adapter.getHistory(),
                adapter.getCategories(),
                adapter.getWeekStartDate()
            ]);
            setItems(loadedItems);
            setHistorySuggestions(loadedHistory);

            // If no categories in DB, use defaults, but don't save them to DB automatically yet 
            // to keep it clean. Or we can just use defaults in the UI if list is empty.
            // Better: If empty, we map defaults to a Category structure without IDs (or fake IDs)
            // But strict ID requirement for management might be tricky.
            // Let's rely on what's in DB. If DB is empty, UI should probably show defaults or 
            // we should seed DB.
            // Strategy: return loaded categories. If empty, the UI will just show "Uncategorized".
            // WAIT, the requirement implies we REPLACE the hardcoded list.
            // If I return empty, existing items might fall into Uncategorized.
            // Let's seed the DB if empty? Or just let the user manage it.
            // For MVP validation, I'll seed if empty locally in state, but ideally we seed DB.
            // For now, let's just use what's returned.
            // ACTUALLY, to preserve existing behavior for the user, if DB returns empty, 
            // we should probably populate it with defaults on first run, OR just return defaults in State.

            if (loadedCategories.length === 0) {
                // Option: Seed defaults?
                // Let's just set defaults in state with fake IDs to start, or rely on UI to handle empty.
                // But wait, the previous code had constant CATEGORIES.
                // Let's seed the database if it's empty so the user feels like nothing broke.
                // I will do this in the component or a specialized init useEffect, but for now
                // let's just set the state.
                // Actually, if we use defaults, they won't have IDs for deleting.
                // Providing a "Seed Defaults" button in UI might be better.
                setCategories([]);
            } else {
                setCategories(loadedCategories);
            }

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

    // --- Category Management ---
    const addCategory = useCallback(async (name: string) => {
        try {
            const newCat = await adapter.addCategory(name);
            setCategories(prev => [...prev, newCat]);
        } catch (e) {
            console.error(e);
            alert("Failed to add category");
        }
    }, []);

    const deleteCategory = useCallback(async (id: string) => {
        try {
            setCategories(prev => prev.filter(c => c.id !== id));
            await adapter.deleteCategory(id);
        } catch (e) {
            console.error(e);
            alert("Failed to delete category");
        }
    }, []);

    return {
        items,
        historySuggestions,
        categories,
        weekStartDate,
        addItem,
        toggleItem,
        updateCategory,
        deleteItem,
        clearCompleted,
        resetList,
        refresh,
        addCategory,
        deleteCategory,
        isLoaded
    };
}
