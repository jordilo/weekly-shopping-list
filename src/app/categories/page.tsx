"use client";

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import { Input, Button, Card, CardHeader, CardBody, Divider } from '@heroui/react';
import { PageContainer } from '@/components/page-container';

export default function CategoriesPage() {
    const { categories, addCategory, deleteCategory, isLoaded } = useShoppingList();
    const [newCategory, setNewCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        setIsSubmitting(true);
        try {
            await addCategory(newCategory.trim());
            setNewCategory('');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isLoaded) {
        return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
    }

    return (
        <PageContainer className="pb-32">
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
                <CardHeader className="p-6 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Add New Category</h2>
                    <form onSubmit={handleAdd} className="flex gap-3 w-full items-start">
                        <Input
                            type="text"
                            value={newCategory}
                            onValueChange={setNewCategory}
                            placeholder="New category name..."
                            variant="bordered"
                            className="flex-1"
                            classNames={{
                                inputWrapper: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                            }}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            disabled={!newCategory.trim() || isSubmitting}
                            color="primary"
                            className="font-bold"
                            startContent={<Plus size={20} />}
                        >
                            <span>Add</span>
                        </Button>
                    </form>
                </CardHeader>
                <Divider />
                <CardBody className="p-0">
                    <div className="flex flex-col">
                        {categories.map((cat, index) => (
                            <div key={cat.id}>
                                <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                    <span className="font-semibold text-gray-900 dark:text-white uppercase tracking-wide text-xs">{cat.name}</span>
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        color="danger"
                                        className="text-gray-400 hover:text-red-500"
                                        onPress={() => {
                                            if (confirm(`Delete category "${cat.name}"?`)) deleteCategory(cat.id);
                                        }}
                                        aria-label={`Delete ${cat.name}`}
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                                {index < categories.length - 1 && <Divider />}
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p className="font-medium text-lg">No custom categories yet.</p>
                                <p className="text-sm mt-1">Add one above to organize your shopping.</p>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </PageContainer>
    );
}
