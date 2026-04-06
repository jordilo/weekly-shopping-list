import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Item, PushSubscription, ListMembership } from '@/lib/models';
import { getSession } from '@/lib/auth';
import { configureWebPush } from '@/lib/push';
import webpush from 'web-push';

export async function GET(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');

    if (!listId) {
        return NextResponse.json({ error: 'listId is required' }, { status: 400 });
    }

    // Verify membership
    const membership = await ListMembership.findOne({ listId, userId: session.userId });
    if (!membership) {
        return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
    }

    try {
        const items = await Item.find({ listId }).sort({ createdAt: -1 });
        const formattedItems = items.map((doc) => ({
            id: doc._id.toString(),
            listId: doc.listId.toString(),
            name: doc.name,
            completed: doc.completed,
            category: doc.category,
            quantity: doc.quantity || '1',
            createdAt: doc.createdAt,
        }));
        return NextResponse.json(formattedItems);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    try {
        const body = await request.json();
        const { listId } = body;

        if (!listId) {
            return NextResponse.json({ error: 'listId is required' }, { status: 400 });
        }

        // Verify membership
        const membership = await ListMembership.findOne({ listId, userId: session.userId });
        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
        }

        const item = await Item.create(body);

        // --- Trigger Push Notifications (exclude the current user) ---
        const isConfigured = configureWebPush();
        if (isConfigured) {
            // Find all members of the list except the current user
            const memberships = await ListMembership.find({ listId, userId: { $ne: session.userId } });
            const memberUserIds = memberships.map(m => m.userId);

            const subscriptions = await PushSubscription.find({ userId: { $in: memberUserIds } });
            console.log(`Push: found ${subscriptions.length} subscription(s) to notify (excluding current user).`);

            const payload = JSON.stringify({
                title: 'New Item Added',
                body: `${item.name} was added to the list.`,
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
                    console.error('Push: error sending notification:', err.statusCode, err.message);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        return PushSubscription.deleteOne({ endpoint: sub.endpoint });
                    }
                });
            })).catch(err => console.error('Push: broadcast error:', err));
        }

        return NextResponse.json({
            id: item._id.toString(),
            listId: item.listId.toString(),
            name: item.name,
            completed: item.completed,
            category: item.category,
            quantity: item.quantity || '1',
            createdAt: item.createdAt,
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId');

    if (!listId) {
        return NextResponse.json({ error: 'listId is required' }, { status: 400 });
    }

    const membership = await ListMembership.findOne({ listId, userId: session.userId });
    if (!membership) {
        return NextResponse.json({ error: 'Not a member of this list' }, { status: 403 });
    }

    await Item.deleteMany({ listId });
    return NextResponse.json({ success: true });
}
