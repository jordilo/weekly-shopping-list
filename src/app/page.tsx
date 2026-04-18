"use client";

import { AddItemForm } from '@/components/add-item-form';
import { ShoppingList } from '@/components/shopping-list';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import { PageContainer } from '@/components/page-container';
import { FormattedMessage } from 'react-intl';

export default function Home() {
  const { 
    items, 
    historySuggestions, 
    categories, 
    addItem, 
    toggleItem, 
    deleteItem,
    updateItem,
    clearCompleted,
    reorderItems,
    isLoaded,
  } = useShoppingList();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        <FormattedMessage id="app.loading" defaultMessage="Loading..." />
      </div>
    );
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
            onClearCompleted={clearCompleted}
            onReorder={reorderItems}
          />
        </div>
      </div>
    </PageContainer>
  );
}
