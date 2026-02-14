import { ShoppingItem } from '@/lib/hooks/use-shopping-list';
import { Trash2, CheckCircle, Circle } from 'lucide-react';

interface ShoppingListProps {
    items: ShoppingItem[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onCategoryChange: (id: string, newCategory: string) => void;
}

const CATEGORIES = [
    'Produce',
    'Dairy',
    'Meat',
    'Bakery',
    'Pantry',
    'Frozen',
    'Beverages',
    'Household',
    'Other',
    'Uncategorized'
];

export function ShoppingList({ items, onToggle, onDelete, onCategoryChange }: ShoppingListProps) {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg">Your list is empty.</p>
                <p className="text-sm">Add items to get started!</p>
            </div>
        );
    }

    const activeItems = items.filter((i) => !i.completed);
    const completedItems = items.filter((i) => i.completed);

    return (
        <div className="space-y-6 w-full max-w-md">
            {/* Active Items */}
            <div className="space-y-6">
                {Object.entries(
                    activeItems.reduce((acc, item) => {
                        const cat = item.category || 'Uncategorized';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                    }, {} as Record<string, typeof activeItems>)
                ).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-1">
                            {category}
                        </h3>
                        {items.map((item) => (
                            <ShoppingListItem
                                key={item.id}
                                item={item}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                onCategoryChange={onCategoryChange}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Completed Items */}
            {completedItems.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider pt-4 pb-2 border-b dark:border-gray-800">
                        Completed ({completedItems.length})
                    </h3>
                    <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                        {completedItems.map((item) => (
                            <ShoppingListItem
                                key={item.id}
                                item={item}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                onCategoryChange={onCategoryChange}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ShoppingListItem({
    item,
    onToggle,
    onDelete,
    onCategoryChange,
}: {
    item: ShoppingItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onCategoryChange: (id: string, newCategory: string) => void;
}) {
    return (
        <div
            className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all gap-2 ${item.completed
                ? 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-800'
                : 'bg-white border-gray-200 shadow-sm hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700'
                }`}
        >
            <button
                onClick={() => onToggle(item.id)}
                className="flex items-center gap-3 flex-1 text-left w-full"
            >
                <span
                    className={`${item.completed ? 'text-green-500' : 'text-gray-400 group-hover:text-blue-500'
                        }`}
                >
                    {item.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                </span>
                <span
                    className={`text-base font-medium ${item.completed
                        ? 'text-gray-400 line-through decoration-gray-300'
                        : 'text-gray-900 dark:text-gray-100'
                        }`}
                >
                    {item.name}
                </span>
            </button>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pl-9 sm:pl-0">
                <select
                    value={item.category || 'Uncategorized'}
                    onChange={(e) => onCategoryChange(item.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[120px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete item"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
