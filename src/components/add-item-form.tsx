import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input, Button } from '@heroui/react';

interface AddItemFormProps {
    onAdd: (name: string) => Promise<void> | void;
    suggestions?: { name: string; category: string }[];
}

export function AddItemForm({ onAdd, suggestions = [] }: AddItemFormProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await onAdd(name.trim());
            setName('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg items-start">
            <div className="flex-1 w-full">
                <Input
                    type="text"
                    list="shopping-history"
                    value={name}
                    onValueChange={setName}
                    placeholder="Add item (e.g., Milk)"
                    variant="bordered"
                    classNames={{
                        inputWrapper: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                    }}
                    isDisabled={isSubmitting}
                />
                <datalist id="shopping-history">
                    {suggestions.map((item) => (
                        <option key={item.name} value={item.name} />
                    ))}
                </datalist>
            </div>
            <Button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                isLoading={isSubmitting}
                color="primary"
                className="font-bold w-full sm:w-auto"
                startContent={!isSubmitting ? <Plus size={20} /> : undefined}
            >
                <span>Add</span>
            </Button>
        </form>
    );
}
