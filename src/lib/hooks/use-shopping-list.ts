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
// This mimics how a DB client would behave (async methods)
// In the future, we replace 'LocalStorageAdapter' with 'DatabaseAdapter'
interface StorageAdapter {
    getItems: () => Promise<ShoppingItem[]>;
    saveItems: (items: ShoppingItem[]) => Promise<void>;
    getHistory: () => Promise<string[]>;
    addToHistory: (name: string) => Promise<void>;
    getWeekStartDate: () => Promise<number>;
    setWeekStartDate: (date: number) => Promise<void>;
}

const STORAGE_KEY_ITEMS = 'weekly-shopping-list-data';
const STORAGE_KEY_HISTORY = 'weekly-shopping-list-history';
const STORAGE_KEY_WEEK_START = 'weekly-shopping-list-start-date';

// --- LocalStorage Implementation ---
const localStorageAdapter: StorageAdapter = {
    getItems: async () => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
        return stored ? JSON.parse(stored) : [];
    },
    saveItems: async (items) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    },
    getHistory: async () => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
        return stored ? JSON.parse(stored) : [];
    },
    addToHistory: async (name) => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
        const history: string[] = stored ? JSON.parse(stored) : [];

        const normalizedName = name.trim();
        // Case-insensitive check to avoid duplicates like "Milk" and "milk"
        if (!history.some(h => h.toLowerCase() === normalizedName.toLowerCase())) {
            const newHistory = [...history, normalizedName].sort();
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHistory));
        }
    },
    getWeekStartDate: async () => {
        if (typeof window === 'undefined') return Date.now();
        const stored = localStorage.getItem(STORAGE_KEY_WEEK_START);
        return stored ? parseInt(stored, 10) : Date.now();
    },
    setWeekStartDate: async (date) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY_WEEK_START, date.toString());
    }
};

// --- Hook ---
export function useShoppingList() {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [historySuggestions, setHistorySuggestions] = useState<string[]>([]);
    const [weekStartDate, setWeekStartDate] = useState<number>(Date.now());
    const [isLoaded, setIsLoaded] = useState(false);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [loadedItems, loadedHistory, loadedDate] = await Promise.all([
                    localStorageAdapter.getItems(),
                    localStorageAdapter.getHistory(),
                    localStorageAdapter.getWeekStartDate()
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

    // Persist items whenever they change (debounce could be added here for optimization)
    useEffect(() => {
        if (isLoaded) {
            localStorageAdapter.saveItems(items);
        }
    }, [items, isLoaded]);

    const addItem = useCallback(async (name: string, category?: string) => {
        const normalizedName = name.trim();

        setItems((prev) => {
            // Case-insensitive check
            const existingItem = prev.find((item) => item.name.toLowerCase() === normalizedName.toLowerCase());

            if (existingItem) {
                // If exists and completed, reactivate it
                if (existingItem.completed) {
                    return prev.map(i => i.id === existingItem.id ? { ...i, completed: false } : i);
                }
                // If exists and active, do nothing (prevent duplicate)
                return prev;
            }

            const newItem: ShoppingItem = {
                id: crypto.randomUUID(),
                name: normalizedName,
                completed: false,
                category,
                createdAt: Date.now(),
            };

            return [newItem, ...prev];
        });

        // Update history
        await localStorageAdapter.addToHistory(name);
        // Refresh local suggestion state
        const newHistory = await localStorageAdapter.getHistory();
        setHistorySuggestions(newHistory);
    }, []);

    const toggleItem = useCallback((id: string) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, completed: !item.completed } : item
            )
        );
    }, []);

    const deleteItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const clearCompleted = useCallback(() => {
        setItems((prev) => prev.filter((item) => !item.completed));
    }, []);

    const resetList = useCallback(async () => {
        if (confirm("Are you sure you want to start a new week?")) {
            setItems([]);
            const newDate = Date.now();
            setWeekStartDate(newDate);
            await localStorageAdapter.setWeekStartDate(newDate);
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
