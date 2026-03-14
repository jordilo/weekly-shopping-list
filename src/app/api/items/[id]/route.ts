import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Item, PushSubscription } from '@/lib/models';
import { configureWebPush } from '@/lib/push';
import webpush from 'web-push';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await request.json();

        // Fetch the item before updating so we can detect re-adds
        const existing = await Item.findById(id);
        const isReAdd = existing && existing.completed === true && body.completed === false;

        const updated = await Item.findByIdAndUpdate(id, body, { new: true });

        if (!updated) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Send push notification when a completed item is re-added to the list
        if (isReAdd) {
            const isConfigured = configureWebPush();
            if (!isConfigured) {
                console.warn('Push: VAPID not configured, skipping re-add notification.');
            } else {
                const subscriptions = await PushSubscription.find({});
                console.log(`Push: re-add detected, notifying ${subscriptions.length} subscription(s).`);

                const payload = JSON.stringify({
                    title: 'Item Added to List',
                    body: `${updated.name} was added to the list.`,
                    url: '/'
                });

                Promise.all(subscriptions.map(sub => {
                    return webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.keys.p256dh,
                                auth: sub.keys.auth
                            }
                        },
                        payload
                    ).catch(err => {
                        console.error('Push: error sending re-add notification:', err.statusCode, err.message);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            return PushSubscription.deleteOne({ endpoint: sub.endpoint });
                        }
                    });
                })).catch(err => console.error('Push: broadcast error:', err));
            }
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
