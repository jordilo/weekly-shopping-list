import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Invitation, ShoppingList } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // Find pending invitations for user's email
    const invitations = await Invitation.find({
        inviteeEmail: session.email.toLowerCase(),
        status: 'pending',
    }).sort({ createdAt: -1 }).lean();

    // Attach list names
    const listIds = invitations.map(inv => inv.listId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lists = await ShoppingList.find({ _id: { $in: listIds } }).lean() as any[];

    const result = invitations.map(invitation => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inv = invitation as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = lists.find((l: any) => l._id.toString() === inv.listId.toString());
        return {
            id: inv._id.toString(),
            listId: inv.listId.toString(),
            listName: list?.name || 'Unknown List',
            status: inv.status,
            createdAt: inv.createdAt,
        };
    });

    return NextResponse.json(result);
}
