import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ListMembership, User } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Only members can view members
    const membership = await ListMembership.findOne({ listId: id, userId: session.userId });
    if (!membership) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }

    const memberships = await ListMembership.find({ listId: id }).lean();
    const userIds = memberships.map(m => m.userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = await User.find({ _id: { $in: userIds } }).lean() as any[];

    const result = memberships.map(m => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = users.find((u: any) => String(u._id) === String(m.userId));
        return {
            id: String(m._id),
            userId: String(m.userId),
            role: m.role,
            name: user?.name || user?.email || 'Unknown',
            email: user?.email || '',
            picture: user?.picture || '',
            joinedAt: m.joinedAt,
        };
    });

    return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Only owner can remove members
    const ownerMembership = await ListMembership.findOne({ listId: id, userId: session.userId, role: 'owner' });
    if (!ownerMembership) {
        return NextResponse.json({ error: 'Only the owner can remove members' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Cannot remove yourself (the owner)
    if (userId === session.userId) {
        return NextResponse.json({ error: 'Cannot remove yourself as owner' }, { status: 400 });
    }

    await ListMembership.deleteOne({ listId: id, userId });

    return NextResponse.json({ success: true });
}
