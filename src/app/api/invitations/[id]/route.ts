import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Invitation, ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const invitation = await Invitation.findById(id);
    if (!invitation) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Only the invitee can accept/reject
    if (invitation.inviteeEmail.toLowerCase() !== session.email.toLowerCase()) {
        return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
        return NextResponse.json({ error: 'Invitation already processed' }, { status: 400 });
    }

    const { action } = await request.json();

    if (action === 'accept') {
        // Create membership
        await ListMembership.findOneAndUpdate(
            { listId: invitation.listId, userId: session.userId },
            {
                listId: invitation.listId,
                userId: session.userId,
                role: 'member',
                joinedAt: Date.now(),
            },
            { upsert: true }
        );

        invitation.status = 'accepted';
        await invitation.save();

        return NextResponse.json({ success: true, status: 'accepted' });
    } else if (action === 'reject') {
        invitation.status = 'rejected';
        await invitation.save();

        return NextResponse.json({ success: true, status: 'rejected' });
    }

    return NextResponse.json({ error: 'Invalid action. Use "accept" or "reject".' }, { status: 400 });
}
