"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import { Card, CardBody, CardHeader, RadioGroup, Radio } from "@heroui/react";
import { Moon, Sun, Monitor, LogOut, Mail, Check, X, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

interface PendingInvitation {
    id: string;
    listId: string;
    listName: string;
    status: string;
    createdAt: number;
}

interface Subscription {
    id: string;
    name: string;
    role: string;
}

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const { user, logout } = useAuth();
    const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

    const loadData = useCallback(async () => {
        const [invRes, listsRes] = await Promise.all([
            fetch('/api/invitations'),
            fetch('/api/lists'),
        ]);

        if (invRes.ok) {
            setInvitations(await invRes.json());
        }
        if (listsRes.ok) {
            const lists = await listsRes.json();
            setSubscriptions(lists.filter((l: Subscription) => l.role === 'member'));
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
        loadData();
    }, [loadData]);

    const handleRespondInvitation = async (invId: string, action: 'accept' | 'reject') => {
        await fetch(`/api/invitations/${invId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        });
        await loadData();
    };

    const handleUnsubscribe = async (listId: string) => {
        if (!confirm('Unsubscribe from this list? You won\'t see it anymore.')) return;
        await fetch(`/api/lists/${listId}/unsubscribe`, { method: 'POST' });
        await loadData();
    };

    if (!mounted) {
        return null;
    }

    return (
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your app preferences.</p>
            </header>

            {/* Account */}
            {user && (
                <section>
                    <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
                        <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Account</h2>
                        </CardHeader>
                        <CardBody className="px-6 py-6">
                            <div className="flex items-center gap-4 mb-4">
                                {user.picture ? (
                                    <img src={user.picture} alt="" className="w-12 h-12 rounded-full" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                                id="logout-btn"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </CardBody>
                    </Card>
                </section>
            )}

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <section>
                    <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
                        <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                <Mail size={20} />
                                Pending Invitations
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">You&apos;ve been invited to join these lists.</p>
                        </CardHeader>
                        <CardBody className="px-6 py-6">
                            <div className="space-y-3">
                                {invitations.map(inv => (
                                    <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{inv.listName}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRespondInvitation(inv.id, 'accept')}
                                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                                            title="Accept"
                                            id={`accept-invite-${inv.id}`}
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRespondInvitation(inv.id, 'reject')}
                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                            title="Reject"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </section>
            )}

            {/* Subscriptions */}
            {subscriptions.length > 0 && (
                <section>
                    <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
                        <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Subscriptions</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Lists shared with you that you&apos;re subscribed to.</p>
                        </CardHeader>
                        <CardBody className="px-6 py-6">
                            <div className="space-y-2">
                                {subscriptions.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <span className="flex-1 text-sm text-gray-900 dark:text-white">{sub.name}</span>
                                        <button
                                            onClick={() => handleUnsubscribe(sub.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                            title="Unsubscribe"
                                        >
                                            <Trash2 size={14} />
                                            <span className="hidden sm:inline">Unsubscribe</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </section>
            )}

            {/* Appearance */}
            <section>
                <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
                    <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Customize how Weekly Shopping List looks on your device.</p>
                    </CardHeader>
                    <CardBody className="px-6 py-6">
                        <RadioGroup
                            label="Theme Mode"
                            orientation="vertical"
                            value={theme}
                            onValueChange={setTheme}
                            className="mt-2"
                            classNames={{
                                wrapper: "gap-4",
                            }}
                        >
                            <Radio value="system" description="Default to system appearance">
                                <div className="flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-gray-500" />
                                    <span>System</span>
                                </div>
                            </Radio>
                            <Radio value="light" description="Always use light theme">
                                <div className="flex items-center gap-2">
                                    <Sun className="w-4 h-4 text-orange-400" />
                                    <span>Light</span>
                                </div>
                            </Radio>
                            <Radio value="dark" description="Always use dark theme">
                                <div className="flex items-center gap-2">
                                    <Moon className="w-4 h-4 text-blue-400" />
                                    <span>Dark</span>
                                </div>
                            </Radio>
                        </RadioGroup>
                    </CardBody>
                </Card>
            </section>
        </main>
    );
}
