import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, ShoppingList, ListMembership } from '@/lib/models';

/**
 * Test-only auth bypass route.
 * Only enabled when TEST_USER_EMAIL is set (typically in test environments).
 * Creates/finds a test user and sets a session cookie without going through Google OAuth.
 */
export async function POST(request: Request) {
    const testEmail = process.env.TEST_USER_EMAIL;
    if (!testEmail) {
        return NextResponse.json({ error: 'Test auth not enabled' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = body.email || testEmail;
    const name = body.name || 'Test User';

    await dbConnect();

    const user = await User.findOneAndUpdate(
        { email },
        {
            $set: { name, picture: '' },
            $setOnInsert: { email, createdAt: Date.now() },
        },
        { upsert: true, new: true }
    );

    // Create default list if user has no memberships
    const membershipCount = await ListMembership.countDocuments({ userId: user._id });
    if (membershipCount === 0) {
        const defaultList = await ShoppingList.create({
            name: 'My Shopping List',
            ownerId: user._id,
        });

        await ListMembership.create({
            listId: defaultList._id,
            userId: user._id,
            role: 'owner',
        });

        await User.findByIdAndUpdate(user._id, {
            defaultListId: defaultList._id,
        });
    }

    const { token, cookieOptions } = await createSession({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: '',
    });

    const response = NextResponse.json({ success: true, userId: user._id.toString() });
    response.cookies.set('session', token, cookieOptions);
    return response;
}
