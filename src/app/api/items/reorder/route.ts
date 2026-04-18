import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Item, ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    try {
        const { itemIds, listId } = await request.json();
        if (!Array.isArray(itemIds) || !listId) {
            return NextResponse.json({ error: 'itemIds array and listId are required' }, { status: 400 });
        }

        // Verify membership
        const membership = await ListMembership.findOne({ listId, userId: session.userId });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
        }

        // Bulk update orders for these items
        const operations = itemIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, listId },
                update: { $set: { order: index } }
            }
        }));

        if (operations.length > 0) {
            await Item.bulkWrite(operations);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reorder items error:', error);
        return NextResponse.json({ error: 'Failed to reorder items' }, { status: 500 });
    }
}
