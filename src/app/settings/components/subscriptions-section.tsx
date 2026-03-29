"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

interface Subscription {
    id: string;
    name: string;
}

interface SubscriptionsSectionProps {
    subscriptions: Subscription[];
    onUnsubscribe: (listId: string) => Promise<void>;
}

export function SubscriptionsSection({ subscriptions, onUnsubscribe }: SubscriptionsSectionProps) {
    const intl = useIntl();
    if (subscriptions.length === 0) return null;

    return (
        <section id="subscriptions-section">
            <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none" data-testid="subscriptions-card">
                <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        <FormattedMessage id="settings.subscriptions" defaultMessage="Subscriptions" />
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        <FormattedMessage id="settings.subscriptionsDesc" defaultMessage="Lists shared with you that you're subscribed to." />
                    </p>
                </CardHeader>
                <CardBody className="px-6 py-6">
                    <div className="space-y-2">
                        {subscriptions.map(sub => (
                            <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <span className="flex-1 text-sm text-gray-900 dark:text-white">{sub.name}</span>
                                <button
                                    onClick={() => onUnsubscribe(sub.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                    title={intl.formatMessage({ id: 'action.unsubscribe', defaultMessage: 'Unsubscribe' })}
                                    data-testid={`unsubscribe-${sub.id}`}
                                >
                                    <Trash2 size={14} />
                                    <span><FormattedMessage id="action.unsubscribe" defaultMessage="Unsubscribe" /></span>
                                </button>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </section>
    );
}
