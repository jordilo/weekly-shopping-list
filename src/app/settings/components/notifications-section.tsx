"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { Bell, BellOff, X } from "lucide-react";

interface NotificationsSectionProps {
    isSubscribed: boolean;
    isSubscribing: boolean;
    isUnsubscribing: boolean;
    subscribe: () => Promise<void>;
    unsubscribe: () => Promise<void>;
    permissionStatus: NotificationPermission;
}

export function NotificationsSection({
    isSubscribed,
    isSubscribing,
    isUnsubscribing,
    subscribe,
    unsubscribe,
    permissionStatus
}: NotificationsSectionProps) {
    return (
        <section>
            <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
                <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Push Notifications</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts when items are added to your lists.</p>
                </CardHeader>
                <CardBody className="px-6 py-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>
                                {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {isSubscribed ? 'Notifications Enabled' : 'Notifications Disabled'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {permissionStatus === 'denied' ? 'Blocked by browser' : (isSubscribed ? 'You will receive alerts' : 'Enable to stay updated')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={isSubscribed ? unsubscribe : subscribe}
                            disabled={isSubscribing || isUnsubscribing}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                isSubscribed 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            } disabled:opacity-50`}
                            id="push-toggle-btn"
                        >
                            {isSubscribing ? 'Enabling...' : isUnsubscribing ? 'Disabling...' : (isSubscribed ? 'Disable' : 'Enable')}
                        </button>
                    </div>
                    {permissionStatus === 'denied' && (
                        <p className="mt-3 text-xs text-red-500 flex items-center gap-1">
                            <X size={12} />
                            Notifications are blocked. Please enable them in your browser settings.
                        </p>
                    )}
                </CardBody>
            </Card>
        </section>
    );
}
