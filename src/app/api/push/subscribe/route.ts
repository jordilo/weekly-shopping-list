import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PushSubscription } from '@/lib/models';

export async function POST(request: Request) {
    await dbConnect();
    try {
        const subscription = await request.json();

        // Use upsert to avoid duplicate subscriptions for the same endpoint
        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            subscription,
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save subscription:', error);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
}
