"use client";

import { useState, useEffect, useCallback, use } from 'react';
import { UserPlus, Trash2, ArrowLeft, Mail, Crown, Users } from 'lucide-react';
import Link from 'next/link';

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
    const { id } = use(params);
    const [listName, setListName] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<InvitationInfo[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        const [listRes, membersRes, invitesRes] = await Promise.all([
            fetch(`/api/lists/${id}`),
            fetch(`/api/lists/${id}/members`),
            fetch(`/api/lists/${id}/invite`),
        ]);

        if (listRes.ok) {
            const list = await listRes.json();
            setListName(list.name);
        }
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

    const handleInvite = async () => {
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
                setError(data.error || 'Failed to send invitation');
            }
        } finally {
            setSending(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Remove this member from the list?')) return;
        await fetch(`/api/lists/${id}/members`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        await loadData();
    };

    const pendingInvitations = invitations.filter(i => i.status === 'pending');

    return (
        <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <header className="mb-8">
                <Link
                    href="/lists"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-3 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Lists
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{listName}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Manage members and invitations.</p>
            </header>

            {/* Invite Section */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <UserPlus size={20} />
                    Invite People
                </h2>
                <form
                    onSubmit={e => { e.preventDefault(); handleInvite(); }}
                    className="flex gap-3"
                >
                    <div className="flex-1 relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Enter email address..."
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            id="invite-email"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sending || !inviteEmail.trim()}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        id="send-invite-btn"
                    >
                        {sending ? 'Sending...' : 'Invite'}
                    </button>
                </form>
                {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
            </div>

            {/* Members */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={20} />
                    Members ({members.length})
                </h2>
                <div className="space-y-2">
                    {members.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            {member.picture ? (
                                <img src={member.picture} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                                    {(member.name || member.email).charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
                                <p className="text-xs text-gray-400 truncate">{member.email}</p>
                            </div>
                            {member.role === 'owner' ? (
                                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full flex items-center gap-1">
                                    <Crown size={12} />
                                    Owner
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                    title="Remove member"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
                <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Invitations</h2>
                    <div className="space-y-2">
                        {pendingInvitations.map(inv => (
                            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{inv.inviteeEmail}</span>
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium px-2 py-1 bg-amber-50 dark:bg-amber-950/30 rounded-full">Pending</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
