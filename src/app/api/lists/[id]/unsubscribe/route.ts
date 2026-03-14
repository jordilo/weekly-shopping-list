import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Only members (not owners) can unsubscribe
    const membership = await ListMembership.findOne({ listId: id, userId: session.userId });
    if (!membership) {
        return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
    }

    if (membership.role === 'owner') {
        return NextResponse.json({ error: 'Cannot unsubscribe from your own list. Delete it instead.' }, { status: 400 });
    }

    await ListMembership.deleteOne({ listId: id, userId: session.userId });

    return NextResponse.json({ success: true });
}
