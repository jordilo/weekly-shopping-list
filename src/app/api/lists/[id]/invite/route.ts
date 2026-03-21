import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Invitation, ListMembership, ShoppingList } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Only members can view invitations
    const membership = await ListMembership.findOne({ listId: id, userId: session.userId });
    if (!membership) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const invitations = await Invitation.find({ listId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(invitations.map(invitation => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inv = invitation as any;
        return {
            id: inv._id.toString(),
            inviteeEmail: inv.inviteeEmail,
            status: inv.status,
            createdAt: inv.createdAt,
        };
    }));
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Only owner can invite
    const membership = await ListMembership.findOne({ listId: id, userId: session.userId, role: 'owner' });
    if (!membership) {
        return NextResponse.json({ error: 'Only the owner can invite people' }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email || !email.trim()) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Don't invite yourself
    if (trimmedEmail === session.email) {
        return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // Check if already a pending invitation
    const existing = await Invitation.findOne({
        listId: id,
        inviteeEmail: trimmedEmail,
        status: 'pending',
    });

    if (existing) {
        return NextResponse.json({ error: 'Invitation already pending' }, { status: 400 });
    }

    // Check the list exists
    const list = await ShoppingList.findById(id);
    if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const invitation = await Invitation.create({
        listId: id,
        inviterUserId: session.userId,
        inviteeEmail: trimmedEmail,
        status: 'pending',
    });

    return NextResponse.json({
        id: invitation._id.toString(),
        inviteeEmail: invitation.inviteeEmail,
        status: invitation.status,
        createdAt: invitation.createdAt,
    });
}
