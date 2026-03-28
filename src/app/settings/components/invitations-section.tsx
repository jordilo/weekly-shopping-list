"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { Mail, Check, X } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

interface PendingInvitation {
    id: string;
    listName: string;
}

interface InvitationsSectionProps {
    invitations: PendingInvitation[];
    onRespond: (invId: string, action: 'accept' | 'reject') => Promise<void>;
}

export function InvitationsSection({ invitations, onRespond }: InvitationsSectionProps) {
    const intl = useIntl();
    if (invitations.length === 0) return null;

    return (
        <section>
            <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none" data-testid="pending-invites-card">
                <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Mail size={20} />
                        <FormattedMessage id="settings.invitations" defaultMessage="Pending Invitations" />
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        <FormattedMessage id="settings.invitationsDesc" defaultMessage="You've been invited to join these lists." />
                    </p>
                </CardHeader>
                <CardBody className="px-6 py-6">
                    <div className="space-y-3">
                        {invitations.map(inv => (
                            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{inv.listName}</p>
                                </div>
                                <button
                                    onClick={() => onRespond(inv.id, 'accept')}
                                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                                    title={intl.formatMessage({ id: 'action.accept', defaultMessage: 'Accept' })}
                                    id={`accept-invite-${inv.id}`}
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={() => onRespond(inv.id, 'reject')}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                    title={intl.formatMessage({ id: 'action.reject', defaultMessage: 'Reject' })}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>
        </section>
    );
}
