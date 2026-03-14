import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ShoppingList, ListMembership, Item, Invitation, Meta } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const membership = await ListMembership.findOne({ listId: id, userId: session.userId });
    if (!membership) {
        return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
    }

    const list = await ShoppingList.findById(id);
    if (!list) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({
        id: list._id.toString(),
        name: list.name,
        role: membership.role,
        ownerId: list.ownerId.toString(),
        createdAt: list.createdAt,
    });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Only owner can rename
    const membership = await ListMembership.findOne({ listId: id, userId: session.userId, role: 'owner' });
    if (!membership) {
        return NextResponse.json({ error: 'Only the owner can rename this list' }, { status: 403 });
    }

    const { name } = await request.json();
    const updated = await ShoppingList.findByIdAndUpdate(id, { name: name.trim() }, { new: true });

    if (!updated) {
        return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json({
        id: updated._id.toString(),
        name: updated.name,
        role: 'owner',
        ownerId: updated.ownerId.toString(),
        createdAt: updated.createdAt,
    });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    // Only owner can delete
    const membership = await ListMembership.findOne({ listId: id, userId: session.userId, role: 'owner' });
    if (!membership) {
        return NextResponse.json({ error: 'Only the owner can delete this list' }, { status: 403 });
    }

    // Cascade delete
    await Promise.all([
        ShoppingList.findByIdAndDelete(id),
        ListMembership.deleteMany({ listId: id }),
        Item.deleteMany({ listId: id }),
        Invitation.deleteMany({ listId: id }),
        Meta.deleteMany({ listId: id }),
    ]);

    return NextResponse.json({ success: true });
}
