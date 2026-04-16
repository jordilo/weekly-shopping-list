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
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSearchParams } from 'next/navigation';

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
    const searchParams = useSearchParams();
    const highlightId = searchParams?.get('highlight');

    // Keep selectedItem synchronized with the overarching items list.
    // Handles the edge case where a 'temp-' ID upgrades to a real ID while the modal is open.
    const freshItem = selectedItem ? items.find(i => 
        i.id === selectedItem.id || 
        (selectedItem.id.startsWith('temp-') && i.name === selectedItem.name)
    ) : null;
    
    // We update the selection only if the ID changed or essential props updated
    // Using render-time adjustment to avoid cascading renders.
    if (freshItem && selectedItem && freshItem.id !== selectedItem.id) {
        setSelectedItem(freshItem);
    }

    const handleEditClick = (item: ShoppingItem) => {
        setSelectedItem(item);
        onOpen();
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg"><FormattedMessage id="list.emptyTitle" defaultMessage="Your list is empty." /></p>
                <p className="text-sm"><FormattedMessage id="list.emptySubtitle" defaultMessage="Add items to get started!" /></p>
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
        <div id="shopping-list-main" className="space-y-6 w-full">
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
                                    isHighlighted={item.id === highlightId}
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
                        <FormattedMessage id="list.completedTitle" defaultMessage="Completed ({count})" values={{ count: completedItems.length }} />
                    </h3>
                    <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                        {completedItems.map((item) => (
                            <ShoppingListItem
                                key={item.id}
                                item={item}
                                isHighlighted={item.id === highlightId}
                                onToggle={onToggle}
                                onEditClick={() => handleEditClick(item)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <ItemEditModal 
                key={selectedItem?.name || 'none'}
                isOpen={isOpen} 
                onOpenChange={(open) => {
                    onOpenChange();
                    if (!open) setSelectedItem(null);
                }} 
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
    isHighlighted,
    onToggle,
    onEditClick,
}: {
    item: ShoppingItem;
    isHighlighted?: boolean;
    onToggle: (id: string) => void;
    onEditClick: () => void;
}) {
    const quantity = item.quantity || '1';
    
    return (
        <div
            className={`group flex items-center justify-between p-3 rounded-xl border transition-all gap-3 cursor-pointer ${isHighlighted ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : item.completed
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
                            <FormattedMessage id="list.qty" defaultMessage="Qty: {quantity}" values={{ quantity }} />
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
    const [quantity, setQuantity] = useState(item?.quantity || '1');
    const [category, setCategory] = useState(item?.category || 'Uncategorized');
    const intl = useIntl();


    const handleSave = (onClose: () => void) => {
        if (!item) return;
        onUpdate(item.id, { 
            quantity, 
            category 
        });
        onClose();
    };

    const handleDelete = (onClose: () => void) => {
        if (!item) return;
        if (window.confirm(intl.formatMessage({ id: 'action.deleteConfirm', defaultMessage: 'Delete {name}?' }, { name: item.name }))) {
            onDelete(item.id);
            onClose();
        }
    };

    const uniqueOptions = Array.from(new Set([
        ...categories, 
        item?.category || 'Uncategorized', 
        'Uncategorized'
    ]));

    return (
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange}
            placement="center"
            backdrop="blur"
            classNames={{
                base: "bg-white dark:bg-gray-900 !bg-opacity-100 border border-gray-200 dark:border-gray-800 shadow-2xl min-w-[320px] sm:min-w-[450px]",
                header: "border-b border-gray-100 dark:border-gray-800 p-6",
                body: "p-6",
                footer: "border-t border-gray-100 dark:border-gray-800 p-6 flex justify-between items-center",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {!item ? null : (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        <FormattedMessage id="modal.editItemMode" defaultMessage="Edit Item" />
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        <FormattedMessage id="modal.editItemDesc" defaultMessage="Update details for this product" />
                                    </p>
                                </ModalHeader>
                                <ModalBody>
                                    <div className="flex flex-col gap-8 w-full py-2">
                                        <Input
                                            value={item.name}
                                            labelPlacement="outside"
                                            label={intl.formatMessage({ id: 'modal.productName', defaultMessage: 'Product Name' })}
                                            isReadOnly
                                            variant="bordered"
                                            description={intl.formatMessage({ id: 'modal.readonlyDesc', defaultMessage: 'Name cannot be changed here' })}
                                            classNames={{
                                                label: "text-sm font-bold text-blue-600 dark:text-blue-400",
                                                input: "text-gray-500 bg-gray-50/50 dark:bg-gray-800/50",
                                                inputWrapper: "border-gray-200 dark:border-gray-700",
                                            }}
                                        />

                                        <Input
                                            id="quantity-input"
                                            label={intl.formatMessage({ id: 'modal.quantity', defaultMessage: 'Quantity' })}
                                            labelPlacement="outside"
                                            placeholder={intl.formatMessage({ id: 'modal.quantityPlaceholder', defaultMessage: 'e.g., 2, 500g, 1 pack' })}
                                            value={quantity}
                                            onValueChange={setQuantity}
                                            variant="bordered"
                                            classNames={{
                                                label: "text-sm font-bold text-gray-700 dark:text-gray-300",
                                                inputWrapper: "border-gray-200 dark:border-gray-700",
                                            }}
                                        />

                                        <Select
                                            id="category-select"
                                            label={intl.formatMessage({ id: 'modal.category', defaultMessage: 'Category' })}
                                            labelPlacement="outside"
                                            selectedKeys={[category]}
                                            onSelectionChange={(keys) => setCategory(String(Array.from(keys)[0]))}
                                            variant="bordered"
                                            classNames={{
                                                label: "text-sm font-bold text-gray-700 dark:text-gray-300",
                                                trigger: "border-gray-200 dark:border-gray-700 bg-transparent",
                                            }}
                                            popoverProps={{
                                                classNames: {
                                                    content: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl opacity-100",
                                                }
                                            }}
                                        >
                                            {uniqueOptions.map((cat) => (
                                                <SelectItem key={cat} className="text-gray-900 dark:text-gray-100">
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        color="danger"
                                        variant="flat"
                                        onPress={() => handleDelete(onClose)}
                                        startContent={<Trash2 size={18} />}
                                    >
                                        <FormattedMessage id="action.delete" defaultMessage="Delete" />
                                    </Button>
                                    <div className="flex gap-3">
                                        <Button variant="light" onPress={onClose}>
                                            <FormattedMessage id="action.cancel" defaultMessage="Cancel" />
                                        </Button>
                                        <Button color="primary" onPress={() => handleSave(onClose)} className="font-bold">
                                            <FormattedMessage id="action.saveChanges" defaultMessage="Save Changes" />
                                        </Button>
                                    </div>
                                </ModalFooter>
                            </>
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
