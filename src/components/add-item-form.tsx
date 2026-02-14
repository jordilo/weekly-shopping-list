import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddItemFormProps {
    onAdd: (name: string) => void;
    suggestions?: { name: string; category: string }[];
}

export function AddItemForm({ onAdd, suggestions = [] }: AddItemFormProps) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd(name.trim());
        setName('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
            <div className="flex-1 space-y-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        list="shopping-history"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Add item (e.g., Milk)"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <datalist id="shopping-history">
                        {suggestions.map((item) => (
                            <option key={item.name} value={item.name} />
                        ))}
                    </datalist>
                </div>
            </div>
            <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 self-start"
            >
                <Plus size={20} />
                <span className="hidden sm:inline">Add</span>
            </button>
        </form>
    );
}
