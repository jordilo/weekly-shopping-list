import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ShoppingList, ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { Types } from 'mongoose';

interface LeanMembership {
    _id: Types.ObjectId;
    listId: Types.ObjectId;
    userId: Types.ObjectId;
    role: string;
    joinedAt: number;
}

interface LeanList {
    _id: Types.ObjectId;
    name: string;
    ownerId: Types.ObjectId;
    createdAt: number;
}

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // Find all lists where user is a member, sorted by their custom order
    const memberships = await ListMembership.find({ userId: session.userId })
        .sort({ order: 1, joinedAt: -1 })
        .lean() as unknown as LeanMembership[];
    
    const listIds = memberships.map(m => m.listId);

    const lists = await ShoppingList.find({ _id: { $in: listIds } })
        .lean() as unknown as LeanList[];

    // Get pending counts for all lists
    const { Item } = await import('@/lib/models');
    const counts = await Item.aggregate([
        { $match: { listId: { $in: listIds }, completed: false } },
        { $group: { _id: '$listId', count: { $sum: 1 } } }
    ]);

    // Format and preserve the order from memberships
    const formatted = memberships.map(membership => {
        const list = lists.find(l => l._id.toString() === membership.listId.toString());
        if (!list) return null;

        const countObj = counts.find(c => c._id.toString() === list._id.toString());
        return {
            id: list._id.toString(),
            name: list.name,
            role: membership.role || 'member',
            ownerId: list.ownerId.toString(),
            createdAt: list.createdAt,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            order: (membership as any).order || 0,
            pendingCount: countObj ? countObj.count : 0,
        };
    }).filter(Boolean);

    return NextResponse.json(formatted);
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { name } = await request.json();
    if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const list = await ShoppingList.create({
        name: name.trim(),
        ownerId: session.userId,
    });

    await ListMembership.create({
        listId: list._id,
        userId: session.userId,
        role: 'owner',
    });

    return NextResponse.json({
        id: list._id.toString(),
        name: list.name,
        role: 'owner',
        ownerId: session.userId,
        createdAt: list.createdAt,
        pendingCount: 0,
    });
}
