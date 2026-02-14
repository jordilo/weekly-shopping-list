import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Category } from '@/lib/hooks/use-shopping-list';

interface CategoryManagerProps {
    categories: Category[];
    onAdd: (name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
}

export function CategoryManager({ categories, onAdd, onDelete, onClose }: CategoryManagerProps) {
    const [newCategory, setNewCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        setIsSubmitting(true);
        try {
            await onAdd(newCategory.trim());
            setNewCategory('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                    <h2 className="text-lg font-semibold">Manage Categories</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <div className="space-y-2 mb-6">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                                <span className="font-medium">{cat.name}</span>
                                <button
                                    onClick={() => {
                                        if (confirm(`Delete category "${cat.name}"?`)) onDelete(cat.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-center text-gray-500 italic py-4">No custom categories yet. Using defaults if available.</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category..."
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={!newCategory.trim() || isSubmitting}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
