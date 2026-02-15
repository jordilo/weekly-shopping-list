import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { History } from '@/lib/models';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    await dbConnect();
    try {
        const { name } = await params;
        const decodedName = decodeURIComponent(name);
        const { newName, category } = await request.json();

        // Update the history item
        const updated = await History.findOneAndUpdate(
            { name: decodedName },
            { $set: { name: newName, category: category } },
            { new: true, upsert: false } // We don't want to create if it doesn't exist
        );

        if (!updated) {
            return NextResponse.json({ error: 'History item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, item: updated });
    } catch {
        return NextResponse.json({ error: 'Failed to update history item' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    await dbConnect();
    try {
        const { name } = await params;
        const decodedName = decodeURIComponent(name);
        await History.findOneAndDelete({ name: decodedName });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete history item' }, { status: 500 });
    }
}
