import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Item } from '@/lib/models';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await request.json();
        const updated = await Item.findByIdAndUpdate(id, body, { new: true });

        if (!updated) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: updated._id.toString(),
            name: updated.name,
            completed: updated.completed,
            category: updated.category,
            quantity: updated.quantity || '1',
            createdAt: updated.createdAt,
        });
    } catch {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    try {
        const { id } = await params;
        await Item.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
