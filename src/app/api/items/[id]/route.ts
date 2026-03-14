import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Item, PushSubscription, ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { configureWebPush } from '@/lib/push';
import webpush from 'web-push';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const { id } = await params;
        const body = await request.json();

        // Fetch the item and verify membership
        const existing = await Item.findById(id);
        if (!existing) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const membership = await ListMembership.findOne({ listId: existing.listId, userId: session.userId });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
        }

        const isReAdd = existing.completed === true && body.completed === false;
        const updated = await Item.findByIdAndUpdate(id, body, { new: true });

        if (!updated) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Send push notification when a completed item is re-added (exclude current user)
        if (isReAdd) {
            const isConfigured = configureWebPush();
            if (isConfigured) {
                const memberships = await ListMembership.find({ listId: existing.listId, userId: { $ne: session.userId } });
                const memberUserIds = memberships.map(m => m.userId);
                const subscriptions = await PushSubscription.find({ userId: { $in: memberUserIds } });

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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const { id } = await params;
        const item = await Item.findById(id);
        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const membership = await ListMembership.findOne({ listId: item.listId, userId: session.userId });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
        }

        await Item.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
