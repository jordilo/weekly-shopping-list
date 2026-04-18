import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    try {
        const { listIds } = await request.json();
        if (!Array.isArray(listIds)) {
            return NextResponse.json({ error: 'listIds array is required' }, { status: 400 });
        }

        // Bulk update orders for this user's memberships
        const operations = listIds.map((id, index) => ({
            updateOne: {
                filter: { listId: id, userId: session.userId },
                update: { $set: { order: index } }
            }
        }));

        if (operations.length > 0) {
            await ListMembership.bulkWrite(operations);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reorder lists error:', error);
        return NextResponse.json({ error: 'Failed to reorder lists' }, { status: 500 });
    }
}
