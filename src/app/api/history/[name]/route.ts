import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { History } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const { name } = await params;
        const decodedName = decodeURIComponent(name);
        const { newName, category } = await request.json();

        const updated = await History.findOneAndUpdate(
            { name: decodedName, userId: session.userId },
            { $set: { name: newName, category } },
            { new: true, upsert: false }
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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const { name } = await params;
        const decodedName = decodeURIComponent(name);
        await History.findOneAndDelete({ name: decodedName, userId: session.userId });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete history item' }, { status: 500 });
    }
}
