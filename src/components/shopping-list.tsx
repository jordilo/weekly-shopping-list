import { ShoppingItem } from '@/lib/hooks/use-shopping-list';
import { Trash2, CheckCircle, Circle } from 'lucide-react';

interface ShoppingListProps {
    items: ShoppingItem[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export function ShoppingList({ items, onToggle, onDelete }: ShoppingListProps) {
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
            <div className="space-y-2">
                {activeItems.map((item) => (
                    <ShoppingListItem
                        key={item.id}
                        item={item}
                        onToggle={onToggle}
                        onDelete={onDelete}
                    />
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
}: {
    item: ShoppingItem;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div
            className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${item.completed
                    ? 'bg-gray-50 border-gray-200 dark:bg-gray-900/50 dark:border-gray-800'
                    : 'bg-white border-gray-200 shadow-sm hover:border-blue-300 dark:bg-gray-800 dark:border-gray-700'
                }`}
        >
            <button
                onClick={() => onToggle(item.id)}
                className="flex items-center gap-3 flex-1 text-left"
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

            <button
                onClick={() => onDelete(item.id)}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete item"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}
