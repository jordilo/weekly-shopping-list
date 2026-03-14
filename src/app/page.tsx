"use client";

import { AddItemForm } from '@/components/add-item-form';
import { ShoppingList } from '@/components/shopping-list';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import { RefreshCw, Settings, List as ListIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const { items, historySuggestions, weekStartDate, categories, addItem, toggleItem, deleteItem,
    clearCompleted,
    resetList,
    updateItem,
    refresh,
    isLoaded,
    lists,
    activeListId,
    activeList,
    setActiveListId,
  } = useShoppingList();

  const [showListPicker, setShowListPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowListPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(weekStartDate);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <header className="mb-8 text-center sm:text-left sm:flex sm:items-end sm:justify-between border-b pb-6 dark:border-gray-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 justify-center sm:justify-start">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
              <Image
                src="/icons/icon.svg"
                alt="Weekly Shopping List"
                width={28}
                height={28}
                className="object-cover object-center"
              />
            </span>
            Weekly Shop
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Week of {formattedDate}
          </p>

          {/* List Selector */}
          {lists.length > 1 && (
            <div className="relative mt-3" ref={pickerRef}>
              <button
                onClick={() => setShowListPicker(!showListPicker)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                id="list-selector"
              >
                {activeList?.name || 'Select list'}
                <ChevronDown size={16} className={`transition-transform ${showListPicker ? 'rotate-180' : ''}`} />
              </button>

              {showListPicker && (
                <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-700 py-1 overflow-hidden">
                  {lists.map(list => (
                    <button
                      key={list.id}
                      onClick={() => {
                        setActiveListId(list.id);
                        setShowListPicker(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        list.id === activeListId
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="truncate">{list.name}</span>
                      {list.role === 'member' && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">shared</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
          <div className="hidden sm:flex gap-2">
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
          </div>
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
            onUpdateItem={updateItem}
          />
        </div>
      </div>
    </div>
  );
}
