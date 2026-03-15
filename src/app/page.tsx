"use client";

import { AddItemForm } from '@/components/add-item-form';
import { ShoppingList } from '@/components/shopping-list';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';

export default function Home() {
  const { 
    items, 
    historySuggestions, 
    categories, 
    addItem, 
    toggleItem, 
    deleteItem,
    updateItem,
    isLoaded,
  } = useShoppingList();

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col gap-8 items-center">
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
