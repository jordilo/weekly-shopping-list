"use client";

import { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Search, Edit2, Check, X } from 'lucide-react';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import Link from 'next/link';

export default function ItemsManagerPage() {
    const { historySuggestions, categories, deleteHistoryItem, addHistoryItem, renameHistoryItem, isLoaded } = useShoppingList();
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('Uncategorized');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit state
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');

    const filteredItems = historySuggestions.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setIsSubmitting(true);
        try {
            await addHistoryItem(newItemName.trim(), newItemCategory);
            setNewItemName('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditing = (name: string, category: string) => {
        setEditingItem(name);
        setEditName(name);
        setEditCategory(category);
    };

    const cancelEditing = () => {
        setEditingItem(null);
        setEditName('');
        setEditCategory('');
    };

    const handleSaveEdit = async (oldName: string) => {
        if (!editName.trim()) return;

        try {
            await renameHistoryItem(oldName, editName.trim(), editCategory);
            setEditingItem(null);
        } catch (e) {
            console.error(e);
        }
    };

    if (!isLoaded) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
            <header className="mb-8 flex items-center justify-between border-b pb-6 dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Manage Items</h1>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
                {/* Add Item Form */}
                <div className="p-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Add New Master Item</h2>
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Item name (e.g. Milk)..."
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={newItemCategory}
                            onChange={(e) => setNewItemCategory(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Uncategorized">Uncategorized</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            disabled={!newItemName.trim() || isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            <span>Add</span>
                        </button>
                    </form>
                </div>

                {/* Search and List */}
                <div className="p-4 border-b dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            data-testid="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search items or categories..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                <div className="divide-y dark:divide-gray-800">
                    {filteredItems.map((item) => (
                        <div
                            key={item.name}
                            data-testid="item-row"
                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        >
                            {editingItem === item.name ? (
                                <div className="flex-1 flex flex-col sm:flex-row gap-2 mr-4">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                                        autoFocus
                                    />
                                    <select
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                    >
                                        <option value="Uncategorized">Uncategorized</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                {editingItem === item.name ? (
                                    <>
                                        <button
                                            onClick={() => handleSaveEdit(item.name)}
                                            className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded-full transition-colors"
                                            title="Save Changes"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={cancelEditing}
                                            className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
                                            title="Cancel"
                                        >
                                            <X size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => startEditing(item.name, item.category)}
                                            className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            aria-label={`Edit ${item.name}`}
                                            title="Edit Item"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Delete "${item.name}" from suggestions?`)) deleteHistoryItem(item.name);
                                            }}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            aria-label={`Delete ${item.name}`}
                                            title="Delete Item"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>{searchQuery ? 'No items match your search.' : 'No items in the master list yet.'}</p>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-center text-sm text-gray-500">
                Items managed here will appear as suggestions when you add items to your weekly shop.
            </p>
        </div>
    );
}
