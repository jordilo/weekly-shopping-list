import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { History } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const history = await History.find({ userId: session.userId }).sort({ name: 1 });
        return NextResponse.json(history.map(h => ({ name: h.name, category: h.category })));
    } catch {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const { name, category } = await request.json();
        if (name) {
            await History.updateOne(
                { name, userId: session.userId },
                { $set: { name, category, userId: session.userId } },
                { upsert: true }
            );
        }
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
    }
}
