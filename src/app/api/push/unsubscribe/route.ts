import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PushSubscription } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
        }

        await PushSubscription.deleteOne({ endpoint, userId: session.userId });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to unsubscribe:', error);
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }
}
