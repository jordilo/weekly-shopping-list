import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PushSubscription } from '@/lib/models';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const subscription = await request.json();

        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            { ...subscription, userId: session.userId },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save subscription:', error);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
}
