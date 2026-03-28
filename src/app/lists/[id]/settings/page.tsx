"use client";

import { useState, useEffect, useCallback, use } from 'react';
import { UserPlus, Trash2, Mail, Crown, Users } from 'lucide-react';
import Image from 'next/image';
import { PageContainer } from '@/components/page-container';
import { FormattedMessage, useIntl } from 'react-intl';

import { Input, Button, Card, CardHeader, CardBody, Divider } from '@heroui/react';

interface Member {
    id: string;
    userId: string;
    role: string;
    name: string;
    email: string;
    picture: string;
    joinedAt: number;
}

interface InvitationInfo {
    id: string;
    inviteeEmail: string;
    status: string;
    createdAt: number;
}

export default function ListSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const intl = useIntl();
    const { id } = use(params);
    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<InvitationInfo[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        const [, membersRes, invitesRes] = await Promise.all([
            fetch(`/api/lists/${id}`),
            fetch(`/api/lists/${id}/members`),
            fetch(`/api/lists/${id}/invite`),
        ]);

        if (membersRes.ok) {
            setMembers(await membersRes.json());
        }
        if (invitesRes.ok) {
            setInvitations(await invitesRes.json());
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInvite = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inviteEmail.trim()) return;
        setSending(true);
        setError('');

        try {
            const res = await fetch(`/api/lists/${id}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail.trim() }),
            });

            if (res.ok) {
                setInviteEmail('');
                await loadData();
            } else {
                const data = await res.json();
                setError(data.error || intl.formatMessage({ id: 'error.inviteFailed', defaultMessage: 'Failed to send invitation' }));
            }
        } finally {
            setSending(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!window.confirm(intl.formatMessage({ id: 'members.removeConfirm', defaultMessage: 'Remove this member from the list?' }))) return;
        await fetch(`/api/lists/${id}/members`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        await loadData();
    };

    const pendingInvitations = invitations.filter(i => 
        i.status === 'pending' && 
        !members.some(m => m.email.toLowerCase() === i.inviteeEmail.toLowerCase())
    );

    return (
        <PageContainer className="space-y-8 pb-32">
            <header className="mb-2">
                <p className="text-gray-500 dark:text-gray-400">
                    <FormattedMessage id="listSettings.description" defaultMessage="Manage members and invitations for this list." />
                </p>
            </header>

            {/* Invite Section */}
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm" data-testid="invite-card">
                <CardHeader className="p-6 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <UserPlus size={18} />
                        <FormattedMessage id="listSettings.invitePeople" defaultMessage="Invite People" />
                    </h2>
                    <form onSubmit={handleInvite} className="flex gap-3 w-full">
                        <Input
                            type="email"
                            placeholder={intl.formatMessage({ id: 'listSettings.emailPlaceholder', defaultMessage: 'Enter email address...' })}
                            value={inviteEmail}
                            onValueChange={setInviteEmail}
                            variant="bordered"
                            className="flex-1"
                            startContent={<Mail size={16} className="text-gray-400" />}
                            classNames={{
                                inputWrapper: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                            }}
                            id="invite-email"
                            data-testid="invite-input"
                        />
                        <Button
                            type="submit"
                            disabled={sending || !inviteEmail.trim()}
                            color="primary"
                            className="font-bold"
                            isLoading={sending}
                            id="send-invite-btn"
                        >
                            <FormattedMessage id="action.invite" defaultMessage="Invite" />
                        </Button>
                    </form>
                    {error && (
                        <p className="text-xs text-red-500 font-medium">{error}</p>
                    )}
                </CardHeader>
                <Divider />
                <CardBody className="p-0">
                    <div className="p-6 border-b dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Users size={18} />
                            <FormattedMessage id="listSettings.members" defaultMessage="Members ({count})" values={{ count: members.length }} />
                        </h2>
                    </div>
                    <div className="flex flex-col">
                        {members.map((member, index) => (
                            <div key={member.id}>
                                <div className="flex items-center gap-3 p-4 px-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    {member.picture ? (
                                        <Image src={member.picture} alt={member.name || member.email} width={36} height={36} className="rounded-full ring-2 ring-gray-100 dark:ring-gray-800" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                                            {(member.name || member.email).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate tracking-tight">{member.email}</p>
                                    </div>
                                    {member.role === 'owner' ? (
                                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Crown size={10} />
                                            <FormattedMessage id="role.owner" defaultMessage="Owner" />
                                        </span>
                                    ) : (
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            color="danger"
                                            size="sm"
                                            onPress={() => handleRemoveMember(member.userId)}
                                            className="text-gray-400 hover:text-red-500"
                                            title={intl.formatMessage({ id: 'action.removeMember', defaultMessage: 'Remove member' })}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                                {index < members.length - 1 && <Divider />}
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm mt-8" data-testid="pending-invites-card">
                    <CardHeader className="p-6 bg-gray-50/50 dark:bg-gray-900/50">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            <FormattedMessage id="listSettings.pendingInvitations" defaultMessage="Pending Invitations" />
                        </h2>
                    </CardHeader>
                    <Divider />
                    <CardBody className="p-0">
                        <div className="flex flex-col">
                            {pendingInvitations.map((inv, index) => (
                                <div key={inv.id}>
                                    <div className="flex items-center gap-3 p-4 px-6 bg-gray-50/20 dark:bg-gray-800/20 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                            <Mail size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{inv.inviteeEmail}</span>
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                                            <FormattedMessage id="status.pending" defaultMessage="Pending" />
                                        </span>
                                    </div>
                                    {index < pendingInvitations.length - 1 && <Divider />}
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </PageContainer>
    );
}
