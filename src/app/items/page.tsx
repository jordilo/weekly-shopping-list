"use client";

import { useState } from 'react';
import { Plus, Trash2, Search, Edit2, Check, X } from 'lucide-react';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import { Input, Button, Select, SelectItem, Card, CardHeader, CardBody, Divider } from '@heroui/react';
import { PageContainer } from '@/components/page-container';
import { FormattedMessage, useIntl } from 'react-intl';

export default function ItemsManagerPage() {
    const { historySuggestions, categories, deleteHistoryItem, addHistoryItem, renameHistoryItem, isLoaded } = useShoppingList();
    const intl = useIntl();
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('Uncategorized');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit state
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');

    const filteredItems = historySuggestions.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setIsSubmitting(true);
        try {
            await addHistoryItem(newItemName.trim(), newItemCategory);
            setNewItemName('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditing = (name: string, category: string) => {
        setEditingItem(name);
        setEditName(name);
        setEditCategory(category);
    };

    const cancelEditing = () => {
        setEditingItem(null);
        setEditName('');
        setEditCategory('');
    };

    const handleSaveEdit = async (oldName: string) => {
        if (!editName.trim()) return;

        try {
            await renameHistoryItem(oldName, editName.trim(), editCategory);
            setEditingItem(null);
        } catch (e) {
            console.error(e);
        }
    };

    if (!isLoaded) {
        return <div className="flex h-screen items-center justify-center text-gray-500"><FormattedMessage id="app.loading" defaultMessage="Loading..." /></div>;
    }

    return (
        <PageContainer className="pb-32">
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
                <CardHeader className="p-6 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <FormattedMessage id="items.addMasterItem" defaultMessage="Add New Master Item" />
                    </h2>
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 w-full">
                        <Input
                            type="text"
                            value={newItemName}
                            onValueChange={setNewItemName}
                            placeholder={intl.formatMessage({ id: 'items.namePlaceholder', defaultMessage: 'Item name (e.g. Milk)...' })}
                            variant="bordered"
                            className="flex-1"
                            classNames={{
                                inputWrapper: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                            }}
                        />
                        <Select
                            selectedKeys={[newItemCategory]}
                            onSelectionChange={(keys) => setNewItemCategory(String(Array.from(keys)[0]))}
                            variant="bordered"
                            className="sm:w-48"
                            classNames={{
                                trigger: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                            }}
                            popoverProps={{
                                classNames: {
                                    content: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl !bg-opacity-100",
                                }
                            }}
                        >
                            {[ { name: intl.formatMessage({ id: 'category.uncategorized', defaultMessage: 'Uncategorized' }) }, ...categories ].map(cat => (
                                <SelectItem key={cat.name}>{cat.name}</SelectItem>
                            ))}
                        </Select>
                        <Button
                            type="submit"
                            disabled={!newItemName.trim() || isSubmitting}
                            color="primary"
                            className="font-bold"
                            startContent={<Plus size={20} />}
                        >
                            <span><FormattedMessage id="action.add" defaultMessage="Add" /></span>
                        </Button>
                    </form>
                </CardHeader>
                <Divider />
                <CardBody className="p-0">
                    <div className="p-6 border-b dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
                        <Input
                            data-testid="search-input"
                            type="text"
                            placeholder={intl.formatMessage({ id: 'items.searchPlaceholder', defaultMessage: 'Search items or categories...' })}
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            startContent={<Search className="text-gray-400" size={18} />}
                            variant="bordered"
                            classNames={{
                                inputWrapper: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                            }}
                        />
                    </div>

                    <div className="flex flex-col">
                        {filteredItems.map((item, index) => (
                            <div key={item.name}>
                                <div className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                    {editingItem === item.name ? (
                                        <div className="flex-1 flex flex-col sm:flex-row gap-2 mr-4">
                                            <Input
                                                size="sm"
                                                value={editName}
                                                onValueChange={setEditName}
                                                variant="bordered"
                                                className="flex-1"
                                                autoFocus
                                            />
                                            <Select
                                                size="sm"
                                                selectedKeys={[editCategory]}
                                                onSelectionChange={(keys) => setEditCategory(String(Array.from(keys)[0]))}
                                                variant="bordered"
                                                className="sm:w-40"
                                                popoverProps={{
                                                    classNames: {
                                                        content: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl !bg-opacity-100",
                                                    }
                                                }}
                                            >
                                                {[ { name: intl.formatMessage({ id: 'category.uncategorized', defaultMessage: 'Uncategorized' }) }, ...categories ].map(cat => (
                                                    <SelectItem key={cat.name}>{cat.name}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{item.category}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1">
                                        {editingItem === item.name ? (
                                            <>
                                                <Button
                                                    isIconOnly
                                                    title={intl.formatMessage({ id: 'action.saveChanges', defaultMessage: 'Save Changes' })}
                                                    variant="flat"
                                                    color="success"
                                                    size="sm"
                                                    onPress={() => handleSaveEdit(item.name)}
                                                    className="font-bold"
                                                >
                                                    <Check size={18} />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    size="sm"
                                                    onPress={cancelEditing}
                                                >
                                                    <X size={18} />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    isIconOnly
                                                    title={intl.formatMessage({ id: 'action.editItem', defaultMessage: 'Edit Item' })}
                                                    variant="light"
                                                    size="sm"
                                                    onPress={() => startEditing(item.name, item.category)}
                                                    className="text-gray-400 hover:text-blue-600"
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    title={intl.formatMessage({ id: 'action.deleteItem', defaultMessage: 'Delete Item' })}
                                                    variant="light"
                                                    color="danger"
                                                    size="sm"
                                                    onPress={() => {
                                                        if (window.confirm(intl.formatMessage({ id: 'items.deleteConfirm', defaultMessage: 'Delete "{name}" from suggestions?' }, { name: item.name }))) deleteHistoryItem(item.name);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {index < filteredItems.length - 1 && <Divider />}
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <p className="font-medium text-lg">
                                    {searchQuery 
                                        ? <FormattedMessage id="items.noMatch" defaultMessage="No items match your search." /> 
                                        : <FormattedMessage id="items.noMasterItems" defaultMessage="No items in the master list yet." />
                                    }
                                </p>
                                <p className="text-sm mt-1">
                                    <FormattedMessage id="items.addItemsHelp" defaultMessage="Add items to build your master shopping list." />
                                </p>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </PageContainer>
    );
}
