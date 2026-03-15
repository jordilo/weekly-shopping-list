import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function PUT(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Verify the user is a member of the list
    const membership = await ListMembership.findOne({ listId: id, userId: session.userId });
    if (!membership) {
        return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
    }

    await User.findByIdAndUpdate(session.userId, { defaultListId: id });

    return NextResponse.json({ success: true });
}
