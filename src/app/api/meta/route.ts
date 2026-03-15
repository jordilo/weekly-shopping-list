import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Meta, ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const listId = searchParams.get('listId');

    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    if (listId) {
        const membership = await ListMembership.findOne({ listId, userId: session.userId });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
        }
    }

    try {
        const query: Record<string, unknown> = { key };
        if (listId) query.listId = listId;
        const meta = await Meta.findOne(query);
        return NextResponse.json({ value: meta ? meta.value : null });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch meta' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const { key, value, listId } = await request.json();

        if (listId) {
            const membership = await ListMembership.findOne({ listId, userId: session.userId });
            if (!membership) {
                return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
            }
        }

        const query: Record<string, unknown> = { key };
        if (listId) query.listId = listId;
        await Meta.updateOne(query, { value, listId }, { upsert: true });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to save meta' }, { status: 500 });
    }
}
