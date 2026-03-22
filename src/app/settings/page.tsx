"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { PageContainer } from "@/components/page-container";
import { usePushNotifications } from "@/lib/use-push-notifications";

// Components
import { AccountSection } from "./components/account-section";
import { InvitationsSection } from "./components/invitations-section";
import { SubscriptionsSection } from "./components/subscriptions-section";
import { NotificationsSection } from "./components/notifications-section";
import { AppearanceSection } from "./components/appearance-section";

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
    
    const push = usePushNotifications();

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
        setMounted(true);
        loadData();
    }, [loadData]);

    const handleRespondInvitation = async (invId: string, action: 'accept' | 'reject') => {
        // Optimistic update
        const acceptedInv = invitations.find(i => i.id === invId);
        setInvitations(prev => prev.filter(i => i.id !== invId));
        
        if (action === 'accept' && acceptedInv) {
            setSubscriptions(prev => [...prev, {
                id: acceptedInv.listId,
                name: acceptedInv.listName,
                role: 'member'
            }]);
        }

        try {
            const res = await fetch(`/api/invitations/${invId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (!res.ok) throw new Error('Failed to respond to invitation');
            await loadData();
        } catch (error) {
            console.error(error);
            // Revert on error
            loadData();
        }
    };

    const handleUnsubscribe = async (listId: string) => {
        if (!confirm('Unsubscribe from this list? You won\'t see it anymore.')) return;
        
        // Optimistic update
        setSubscriptions(prev => prev.filter(s => s.id !== listId));
        
        try {
            const res = await fetch(`/api/lists/${listId}/unsubscribe`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to unsubscribe');
            await loadData();
        } catch (error) {
            console.error(error);
            // Revert on error
            loadData();
        }
    };

    if (!mounted) return null;

    return (
        <PageContainer className="space-y-6">
            <header className="mb-2">
                <p className="text-gray-500 dark:text-gray-400">Manage your app preferences.</p>
            </header>

            {user && <AccountSection user={user} onLogout={logout} />}

            <InvitationsSection 
                invitations={invitations} 
                onRespond={handleRespondInvitation} 
            />

            <SubscriptionsSection 
                subscriptions={subscriptions} 
                onUnsubscribe={handleUnsubscribe} 
            />

            <NotificationsSection {...push} />

            <AppearanceSection theme={theme} setTheme={setTheme} />
        </PageContainer>
    );
}
