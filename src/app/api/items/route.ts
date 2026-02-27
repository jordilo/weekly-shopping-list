import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Item, PushSubscription } from '@/lib/models';
import { configureWebPush } from '@/lib/push';
import webpush from 'web-push';

export async function GET() {
    await dbConnect();
    try {
        const items = await Item.find({}).sort({ createdAt: -1 });
        // Transform _id to id for frontend compatibility
        const formattedItems = items.map((doc) => ({
            id: doc._id.toString(),
            name: doc.name,
            completed: doc.completed,
            category: doc.category,
            createdAt: doc.createdAt,
        }));
        return NextResponse.json(formattedItems);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const body = await request.json();
        const item = await Item.create(body);

        // --- Trigger Push Notifications ---
        const subscriptions = await PushSubscription.find({});

        // Initialize push notifications lazily
        configureWebPush();

        const payload = JSON.stringify({
            title: 'New Item Added',
            body: `${item.name} was added to the list.`,
            url: '/'
        });

        // Send notifications to all subscribers in parallel
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
                console.error('Error sending push notification:', err);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    return PushSubscription.deleteOne({ endpoint: sub.endpoint });
                }
            });
        })).catch(err => console.error('Error in push broadcast:', err));

        return NextResponse.json({
            id: item._id.toString(),
            name: item.name,
            completed: item.completed,
            category: item.category,
            createdAt: item.createdAt,
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

export async function PUT() {
    await dbConnect();
    try {
        // Determine what update operation is needed.
        // If 'id' is in body, it's a specific update.
        // However, for bulk updates (like clear list), we might need a different strategy.
        // For simplicity, let's assume this route handles single items via query param or body.

        // Wait, Next.js App Router convention for dynamic ID is `[id]/route.ts`.
        // Beacuse we are doing simple "saveItems" in the client, let's support bulk sync or specific item updates.
        // But the client `saveItems` sends the WHOLE list. That's inefficient for DB.
        // I should stick to singular updates if possible, OR implement a bulk endpoint.
        // For existing frontend logic `saveItems` sends an array.

        // Let's create a Bulk update endpoint or refine the frontend to call API on each action.
        // Refining frontend to call API on each action is cleaner for DBs.
        // So this PUT will handle single item toggle/update if I pass an ID in the URL.
        // But for this file `api/items/route.ts`, it handles collection-level stuff.

        // NOTE: To minimize frontend refactor churn, I will implement a BULK PUT here to match `saveItems` behavior first.
        // Ideally, we move to event-based (addItem makes POST, toggle makes PUT /id).
        // Let's implement BULK replace for now to ensure compatibility with `localStorageAdapter` interface.
        // *Optimisation*: Client logic calls `saveItems` constantly. I should probably refactor the hook to call granular APIs.
        // Let's implement granular APIs in the Hook first.

        return NextResponse.json({ message: "Use method specific routes or POST" }, { status: 405 })

    } catch {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE() {
    // Bulk delete all?
    await dbConnect();
    await Item.deleteMany({});
    return NextResponse.json({ success: true });
}
