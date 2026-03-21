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

    // Find all lists where user is a member
    const memberships = await ListMembership.find({ userId: session.userId }).lean() as unknown as LeanMembership[];
    const listIds = memberships.map(m => m.listId);

    const lists = await ShoppingList.find({ _id: { $in: listIds } })
        .sort({ createdAt: -1 })
        .lean() as unknown as LeanList[];

    const formatted = lists.map(list => {
        const membership = memberships.find(m => m.listId.toString() === list._id.toString());
        return {
            id: list._id.toString(),
            name: list.name,
            role: membership?.role || 'member',
            ownerId: list.ownerId.toString(),
            createdAt: list.createdAt,
        };
    });

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
    });
}
