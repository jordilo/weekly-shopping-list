"use client";

import { useState } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import Link from 'next/link';

export default function CategoriesPage() {
    const { categories, addCategory, deleteCategory, isLoaded } = useShoppingList();
    const [newCategory, setNewCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        setIsSubmitting(true);
        try {
            await addCategory(newCategory.trim());
            setNewCategory('');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
            <header className="mb-8 flex items-center gap-4 border-b pb-6 dark:border-gray-800">
                <Link
                    href="/"
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Manage Categories</h1>
            </header>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Add Category Form */}
                <div className="p-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category name..."
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!newCategory.trim() || isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">Add</span>
                        </button>
                    </form>
                </div>

                {/* Category List */}
                <div className="divide-y dark:divide-gray-800">
                    {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                            <span className="font-medium">{cat.name}</span>
                            <button
                                onClick={() => {
                                    if (confirm(`Delete category "${cat.name}"?`)) deleteCategory(cat.id);
                                }}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                aria-label={`Delete ${cat.name}`}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No custom categories yet.</p>
                            <p className="text-sm mt-1">Add one above to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
