"use client";

import { AddItemForm } from '@/components/add-item-form';
import { ShoppingList } from '@/components/shopping-list';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import { PageContainer } from '@/components/page-container';

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
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <PageContainer>
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
    </PageContainer>
  );
}
