"use client";

import { useShoppingList, ShoppingListInfo } from '@/lib/hooks/use-shopping-list';
import { useAuth } from '@/components/auth-provider';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Settings, Pencil, X, Check } from 'lucide-react';
import Link from 'next/link';

export default function ListsPage() {
    const { lists, refreshLists, activeListId } = useShoppingList();
    const { user } = useAuth();
    const [newListName, setNewListName] = useState('');
    const [creating, setCreating] = useState(false);
    const [defaultListId, setDefaultListId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Fetch default list id
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.defaultListId) setDefaultListId(data.defaultListId);
            })
            .catch(() => { });
    }, []);

    const handleCreate = async () => {
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
        if (!confirm('Delete this list and all its items? This cannot be undone.')) return;
        await fetch(`/api/lists/${id}`, { method: 'DELETE' });
        await refreshLists();
    };

    const handleSetDefault = async (id: string) => {
        await fetch(`/api/lists/${id}/default`, { method: 'PUT' });
        setDefaultListId(id);
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

    const ownedLists = lists.filter(l => l.role === 'owner');
    const subscribedLists = lists.filter(l => l.role === 'member');

    return (
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Lists</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Create and manage your shopping lists.</p>
            </header>

            {/* Create new list */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New List</h2>
                <form
                    onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                    className="flex gap-3"
                >
                    <input
                        type="text"
                        placeholder="List name..."
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="new-list-name"
                    />
                    <button
                        type="submit"
                        disabled={creating || !newListName.trim()}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        id="create-list-btn"
                    >
                        <Plus size={16} />
                        Create
                    </button>
                </form>
            </div>

            {/* Owned Lists */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Lists</h2>
                {ownedLists.length === 0 ? (
                    <p className="text-sm text-gray-400">No lists yet. Create one above!</p>
                ) : (
                    <div className="space-y-2">
                        {ownedLists.map(list => (
                            <ListRow
                                key={list.id}
                                list={list}
                                isDefault={defaultListId === list.id}
                                isActive={activeListId === list.id}
                                isEditing={editingId === list.id}
                                editName={editName}
                                currentUserEmail={user?.email || ''}
                                onSetDefault={() => handleSetDefault(list.id)}
                                onDelete={() => handleDelete(list.id)}
                                onStartEdit={() => { setEditingId(list.id); setEditName(list.name); }}
                                onCancelEdit={() => setEditingId(null)}
                                onSaveEdit={() => handleRename(list.id)}
                                onEditNameChange={setEditName}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Subscribed Lists */}
            {subscribedLists.length > 0 && (
                <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shared with Me</h2>
                    <div className="space-y-2">
                        {subscribedLists.map(list => (
                            <ListRow
                                key={list.id}
                                list={list}
                                isDefault={defaultListId === list.id}
                                isActive={activeListId === list.id}
                                isEditing={false}
                                editName=""
                                currentUserEmail={user?.email || ''}
                                onSetDefault={() => handleSetDefault(list.id)}
                                onDelete={undefined}
                                onStartEdit={undefined}
                                onCancelEdit={undefined}
                                onSaveEdit={undefined}
                                onEditNameChange={undefined}
                            />
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}

interface ListRowProps {
    list: ShoppingListInfo;
    isDefault: boolean;
    isActive: boolean;
    isEditing: boolean;
    editName: string;
    currentUserEmail: string;
    onSetDefault: () => void;
    onDelete?: () => void;
    onStartEdit?: () => void;
    onCancelEdit?: () => void;
    onSaveEdit?: () => void;
    onEditNameChange?: (name: string) => void;
}

function ListRow({
    list, isDefault, isActive, isEditing, editName,
    onSetDefault, onDelete, onStartEdit, onCancelEdit, onSaveEdit, onEditNameChange
}: ListRowProps) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}>
            {/* Default Star */}
            <button
                onClick={onSetDefault}
                className={`flex-shrink-0 transition-colors ${isDefault
                    ? 'text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                    }`}
                title={isDefault ? 'Default list' : 'Set as default'}
            >
                <Star size={18} fill={isDefault ? 'currentColor' : 'none'} />
            </button>

            {/* Name / Edit */}
            {isEditing ? (
                <form
                    className="flex-1 flex items-center gap-2"
                    onSubmit={e => { e.preventDefault(); onSaveEdit?.(); }}
                >
                    <input
                        type="text"
                        value={editName}
                        onChange={e => onEditNameChange?.(e.target.value)}
                        className="flex-1 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <button type="submit" className="text-green-600 hover:text-green-700">
                        <Check size={16} />
                    </button>
                    <button type="button" onClick={onCancelEdit} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                    </button>
                </form>
            ) : (
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                        {list.name}
                    </span>
                    {list.role === 'member' && (
                        <span className="text-xs text-gray-400">Shared list</span>
                    )}
                </div>
            )}

            {/* Actions */}
            {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    {list.role === 'owner' && (
                        <>
                            <Link
                                href={`/lists/${list.id}/settings`}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                title="List settings"
                            >
                                <Settings size={16} />
                            </Link>
                            {onStartEdit && (
                                <button
                                    onClick={onStartEdit}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    title="Rename"
                                >
                                    <Pencil size={16} />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                    title="Delete list"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
