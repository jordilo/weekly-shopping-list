import { ShoppingItem, Category } from '@/lib/hooks/use-shopping-list';
import { Trash2, CheckCircle, Circle, Edit2 } from 'lucide-react';
import { 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter, 
    Button, 
    useDisclosure,
    Input,
    Select,
    SelectItem,
    Chip
} from "@heroui/react";
import { useState, useEffect } from 'react';

interface ShoppingListProps {
    items: ShoppingItem[];
    categories: Category[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
}

const DEFAULT_CATEGORIES = [
    'Produce', 'Dairy', 'Meat', 'Bakery', 'Pantry', 'Frozen', 'Beverages', 'Household', 'Other'
];

export function ShoppingList({ items, categories, onToggle, onDelete, onUpdateItem }: ShoppingListProps) {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);

    const handleEditClick = (item: ShoppingItem) => {
        setSelectedItem(item);
        onOpen();
    };

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

    const effectiveCategoryNames = categories.length > 0
        ? categories.map(c => c.name)
        : DEFAULT_CATEGORIES;

    const groupedItems: Record<string, ShoppingItem[]> = {};
    effectiveCategoryNames.forEach(cat => groupedItems[cat] = []);
    groupedItems['Uncategorized'] = [];

    activeItems.forEach(item => {
        const cat = item.category || 'Uncategorized';
        if (groupedItems[cat]) {
            groupedItems[cat].push(item);
        } else {
            if (!groupedItems[cat]) groupedItems[cat] = [];
            groupedItems[cat].push(item);
        }
    });

    const sortedCategories = [...effectiveCategoryNames];
    Object.keys(groupedItems).forEach(cat => {
        if (!sortedCategories.includes(cat)) {
            sortedCategories.push(cat);
        }
    });

    if (sortedCategories.includes('Uncategorized')) {
        const idx = sortedCategories.indexOf('Uncategorized');
        sortedCategories.splice(idx, 1);
        sortedCategories.push('Uncategorized');
    }

    return (
        <div className="space-y-6 w-full">
            <div className="space-y-6">
                {sortedCategories.map((category) => {
                    const groupItems = groupedItems[category];
                    if (!groupItems || groupItems.length === 0) return null;

                    return (
                        <div key={category} className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-1">
                                {category}
                            </h3>
                            {groupItems.map((item) => (
                                <ShoppingListItem
                                    key={item.id}
                                    item={item}
                                    onToggle={onToggle}
                                    onEditClick={() => handleEditClick(item)}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>

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
                                onEditClick={() => handleEditClick(item)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <ItemEditModal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange} 
                item={selectedItem} 
                categories={effectiveCategoryNames}
                onUpdate={onUpdateItem}
                onDelete={onDelete}
            />
        </div>
    );
}

function ShoppingListItem({
    item,
    onToggle,
    onEditClick,
}: {
    item: ShoppingItem;
    onToggle: (id: string) => void;
    onEditClick: () => void;
}) {
    const quantity = item.quantity || '1';
    
    return (
        <div
            className={`group flex items-center justify-between p-3 rounded-xl border transition-all gap-3 cursor-pointer ${item.completed
                ? 'bg-gray-50/50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-800'
                : 'bg-white border-gray-200 shadow-sm hover:border-blue-400 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md'
                }`}
            onClick={onEditClick}
        >
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(item.id);
                    }}
                    className={`transition-colors flex-shrink-0 ${item.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
                >
                    {item.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                    <span
                        className={`text-base font-semibold truncate ${item.completed
                            ? 'text-gray-400 line-through decoration-gray-300'
                            : 'text-gray-900 dark:text-gray-100'
                            }`}
                    >
                        {item.name}
                    </span>
                    
                    <div className="flex items-center gap-2">
                        {item.category && item.category !== 'Uncategorized' && (
                            <Chip size="sm" variant="flat" color="primary" className="h-5 text-[10px] uppercase font-bold">
                                {item.category}
                            </Chip>
                        )}
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            Qty: {quantity}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 size={16} className="text-gray-400" />
            </div>
        </div>
    );
}

interface ItemEditModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: ShoppingItem | null;
    categories: string[];
    onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
    onDelete: (id: string) => void;
}

function ItemEditModal({ isOpen, onOpenChange, item, categories, onUpdate, onDelete }: ItemEditModalProps) {
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (item) {
            setQuantity(item.quantity || '1');
            setCategory(item.category || 'Uncategorized');
        }
    }, [item]);

    if (!item) return null;

    const handleSave = (onClose: () => void) => {
        onUpdate(item.id, { 
            quantity, 
            category 
        });
        onClose();
    };

    const handleDelete = (onClose: () => void) => {
        if (confirm(`Delete ${item.name}?`)) {
            onDelete(item.id);
            onClose();
        }
    };

    const uniqueOptions = Array.from(new Set([...categories, item.category || 'Uncategorized', 'Uncategorized']));

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange}
            placement="center"
            backdrop="blur"
            classNames={{
                base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
                header: "border-b-[1px] border-[#292f46]",
                footer: "border-t-[1px] border-[#292f46]",
                closeButton: "hover:bg-white/5 active:bg-white/10",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h2 className="text-xl font-bold text-white">Edit Item</h2>
                            <p className="text-sm text-gray-400">Update details for this product</p>
                        </ModalHeader>
                        <ModalBody className="py-6">
                            <div className="space-y-6">
                                <Input
                                    label="Product Name"
                                    value={item.name}
                                    isReadOnly
                                    variant="bordered"
                                    description="Name cannot be changed here"
                                    classNames={{
                                        input: "text-gray-400",
                                        label: "text-blue-400",
                                    }}
                                />
                                
                                <Input
                                    label="Quantity"
                                    placeholder="e.g., 2, 500g, 1 pack"
                                    value={quantity}
                                    onValueChange={setQuantity}
                                    variant="bordered"
                                    autoFocus
                                />

                                <Select
                                    label="Category"
                                    selectedKeys={[category]}
                                    onSelectionChange={(keys) => setCategory(String(Array.from(keys)[0]))}
                                    variant="bordered"
                                >
                                    {uniqueOptions.map((cat) => (
                                        <SelectItem key={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </ModalBody>
                        <ModalFooter className="justify-between">
                            <Button 
                                color="danger" 
                                variant="light" 
                                onPress={() => handleDelete(onClose)}
                                startContent={<Trash2 size={18} />}
                            >
                                Delete
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={() => handleSave(onClose)}>
                                    Save Changes
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
