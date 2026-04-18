"use client";

import { useShoppingList, ShoppingListInfo } from '@/lib/hooks/use-shopping-list';
import { useAuth } from '@/components/auth-provider';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Settings, Pencil, X, Check, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageContainer } from '@/components/page-container';
import Link from 'next/link';
import { Input, Button, Card, CardHeader, CardBody, Divider } from '@heroui/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { offlineDB } from '@/lib/offline-db';

export default function ListsPage() {
    const intl = useIntl();
    const { lists, refreshLists, activeListId, reorderLists } = useShoppingList();
    const { user } = useAuth();
    const [newListName, setNewListName] = useState('');
    const [creating, setCreating] = useState(false);
    const [defaultListId, setDefaultListId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch default list id
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.defaultListId) setDefaultListId(data.defaultListId);
            })
            .catch(() => { });
    }, []);

    const handleCreate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newListName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch('/api/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newListName.trim() }),
            });
            if (res.ok) {
                setNewListName('');
                await refreshLists();
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(intl.formatMessage({ id: 'lists.deleteConfirm', defaultMessage: 'Delete this list and all its items? This cannot be undone.' }))) return;
        await fetch(`/api/lists/${id}`, { method: 'DELETE' });
        await refreshLists();
    };

    const handleSetDefault = async (id: string) => {
        await fetch(`/api/lists/${id}/default`, { method: 'PUT' });
        setDefaultListId(id);
        localStorage.setItem('lastSelectedListId', id);
        // Also update offlineDB meta for consistency
        await offlineDB.setMeta('defaultListId', 'global', id);
    };

    const handleRename = async (id: string) => {
        if (!editName.trim()) return;
        await fetch(`/api/lists/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editName.trim() }),
        });
        setEditingId(null);
        await refreshLists();
    };


    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = lists.findIndex((list) => list.id === active.id);
        const newIndex = lists.findIndex((list) => list.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(lists, oldIndex, newIndex);
            reorderLists(reordered);
        }
    };

    return (
        <PageContainer className="space-y-8 pb-32">
            <header className="mb-2">
                <p className="text-gray-500 dark:text-gray-400">
                    <FormattedMessage id="lists.description" defaultMessage="Create and manage your shopping lists." />
                </p>
            </header>

            {/* Create new list */}
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm" data-testid="my-lists-card">
                <CardHeader className="p-6 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <FormattedMessage id="lists.createNew" defaultMessage="Create New List" />
                    </h2>
                    <form onSubmit={handleCreate} className="flex gap-3 w-full">
                        <Input
                            type="text"
                            placeholder={intl.formatMessage({ id: 'lists.namePlaceholder', defaultMessage: 'List name...' })}
                            value={newListName}
                            onValueChange={setNewListName}
                            variant="bordered"
                            className="flex-1"
                            classNames={{
                                inputWrapper: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                            }}
                            id="new-list-name"
                            data-testid="new-list-input"
                        />
                        <Button
                            type="submit"
                            disabled={creating || !newListName.trim()}
                            color="primary"
                            className="font-bold"
                            startContent={<Plus size={20} />}
                            id="create-list-btn"
                        >
                            <span><FormattedMessage id="action.create" defaultMessage="Create" /></span>
                        </Button>
                    </form>
                </CardHeader>
                <Divider />
                <CardBody className="p-0">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={lists.map(l => l.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col">
                                {lists.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <p className="font-medium text-lg">
                                            <FormattedMessage id="lists.noLists" defaultMessage="No lists yet." />
                                        </p>
                                        <p className="text-sm mt-1">
                                            <FormattedMessage id="lists.createHelp" defaultMessage="Create one above to start shopping." />
                                        </p>
                                    </div>
                                ) : (
                                    lists.map((list: ShoppingListInfo, index: number) => (
                                        <SortableListRow
                                            key={list.id}
                                            id={list.id}
                                            list={list}
                                            isDefault={defaultListId === list.id}
                                            isActive={activeListId === list.id}
                                            isEditing={editingId === list.id}
                                            editName={editName}
                                            onSetDefault={() => handleSetDefault(list.id)}
                                            onDelete={() => handleDelete(list.id)}
                                            onStartEdit={() => { setEditingId(list.id); setEditName(list.name); }}
                                            onCancelEdit={() => setEditingId(null)}
                                            onSaveEdit={() => handleRename(list.id)}
                                            onEditNameChange={setEditName}
                                            isLast={index === lists.length - 1}
                                        />
                                    ))
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </CardBody>
            </Card>
        </PageContainer>
    );
}

function SortableListRow({ id, isLast, ...props }: { id: string; isLast: boolean } & ListRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 0,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <ListRow
                {...props}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
            {!isLast && <Divider />}
        </div>
    );
}

interface ListRowProps {
    list: ShoppingListInfo;
    isDefault: boolean;
    isActive: boolean;
    isEditing: boolean;
    editName: string;
    onSetDefault: () => void;
    onDelete?: () => void;
    onStartEdit?: () => void;
    onCancelEdit?: () => void;
    onSaveEdit?: () => void;
    onEditNameChange?: (name: string) => void;
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

function ListRow({
    list, isDefault, isActive, isEditing, editName,
    onSetDefault, onDelete, onStartEdit, onCancelEdit, onSaveEdit, onEditNameChange,
    dragHandleProps
}: ListRowProps) {
    const intl = useIntl();

    return (
        <div className={`flex items-center gap-3 p-4 px-6 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}>
            {/* Drag Handle */}
            {!isEditing && (
                <div
                    className="cursor-grab active:cursor-grabbing text-gray-400 p-1 -ml-2 hover:text-blue-500 transition-colors"
                    {...dragHandleProps}
                    data-testid={`drag-handle-${list.id}`}
                    style={{ touchAction: 'none' }}
                >
                    <GripVertical size={20} />
                </div>
            )}

            {/* Default Star */}
            <button
                onClick={onSetDefault}
                className={`flex-shrink-0 transition-colors ${isDefault
                    ? 'text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                    }`}
                title={isDefault 
                    ? intl.formatMessage({ id: 'lists.defaultList', defaultMessage: 'Default list' }) 
                    : intl.formatMessage({ id: 'lists.setDefault', defaultMessage: 'Set as default' })
                }
            >
                <Star size={18} fill={isDefault ? 'currentColor' : 'none'} />
            </button>

            {/* Name / Edit */}
            {isEditing ? (
                <form
                    className="flex-1 flex items-center gap-2"
                    onSubmit={e => { e.preventDefault(); onSaveEdit?.(); }}
                >
                    <Input
                        size="sm"
                        value={editName}
                        onValueChange={onEditNameChange}
                        className="flex-1"
                        autoFocus
                        data-testid="rename-input"
                    />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        color="success"
                        onPress={onSaveEdit}
                    >
                        <Check size={16} />
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={onCancelEdit}
                    >
                        <X size={16} />
                    </Button>
                </form>
            ) : (
                <Link href={`/?listId=${list.id}`} className="flex-1 min-w-0 block hover:opacity-80 transition-opacity">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate block">
                        {list.name}
                    </span>
                    {list.role === 'member' && (
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mt-0.5">
                            <FormattedMessage id="lists.sharedList" defaultMessage="Shared list" />
                        </span>
                    )}
                </Link>
            )}

            {/* Actions */}
            {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    {list.role === 'owner' && (
                        <>
                            <Button
                                as={Link}
                                href={`/lists/${list.id}/settings`}
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-gray-400 hover:text-blue-600"
                                title={intl.formatMessage({ id: 'action.listSettings', defaultMessage: 'List settings' })}
                            >
                                <Settings size={16} />
                            </Button>
                            {onStartEdit && (
                                <Button
                                    onClick={onStartEdit}
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    className="text-gray-400 hover:text-gray-600"
                                    title={intl.formatMessage({ id: 'action.rename', defaultMessage: 'Rename' })}
                                >
                                    <Pencil size={16} />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    onClick={onDelete}
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    className="text-gray-400 hover:text-red-500"
                                    title={intl.formatMessage({ id: 'action.deleteList', defaultMessage: 'Delete list' })}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
