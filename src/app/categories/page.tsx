"use client";

import { useState } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import Link from 'next/link';
import { Input, Button, Card, CardHeader, CardBody, Divider } from '@heroui/react';

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
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 pb-32">
            <header className="mb-8 flex items-center gap-4">
                <Link
                    href="/"
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Manage Categories</h1>
            </header>

            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="p-6 bg-gray-50/50 dark:bg-gray-900/50">
                    <form onSubmit={handleAdd} className="flex gap-2 w-full items-start">
                        <Input
                            type="text"
                            value={newCategory}
                            onValueChange={setNewCategory}
                            placeholder="New category name..."
                            variant="bordered"
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
                            <span className="hidden sm:inline">Add</span>
                        </Button>
                    </form>
                </CardHeader>
                <Divider />
                <CardBody className="p-0">
                    <div className="flex flex-col">
                        {categories.map((cat, index) => (
                            <div key={cat.id}>
                                <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</span>
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
        </div>
    );
}
