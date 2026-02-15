"use client";

import { AddItemForm } from '@/components/add-item-form';
import { ShoppingList } from '@/components/shopping-list';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import { ShoppingBag, RefreshCw, Settings, List as ListIcon } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { items, historySuggestions, weekStartDate, categories, addItem, toggleItem, deleteItem,
    clearCompleted,
    resetList,
    updateCategory,
    refresh,
    isLoaded
  } = useShoppingList();

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(weekStartDate);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-8 text-center sm:text-left sm:flex sm:items-end sm:justify-between border-b pb-6 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 justify-center sm:justify-start">
              <span className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                <ShoppingBag size={28} />
              </span>
              Weekly Shop
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Week of {formattedDate}
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex gap-2 justify-center items-center">
            <button
              onClick={refresh}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Refresh list"
              title="Refresh list"
            >
              <RefreshCw size={20} />
            </button>
            <Link
              href="/items"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Manage Items"
              title="Manage Items"
            >
              <ListIcon size={20} />
            </Link>
            <Link
              href="/categories"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Manage Categories"
              title="Manage Categories"
            >
              <Settings size={20} />
            </Link>
            {items.some(i => i.completed) && (
              <button
                onClick={clearCompleted}
                className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Clear Completed
              </button>
            )}
            {items.length > 0 && (
              <button
                onClick={resetList}
                className="text-sm px-3 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors border border-gray-200 dark:border-gray-700"
              >
                New Week
              </button>
            )}
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-8 items-center">
          <AddItemForm onAdd={addItem} suggestions={historySuggestions} />

          <div className="w-full">
            <ShoppingList
              items={items}
              categories={categories}
              onToggle={toggleItem}
              onDelete={deleteItem}
              onUpdateCategory={updateCategory}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
