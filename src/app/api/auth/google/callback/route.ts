import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { createSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, ShoppingList, ListMembership } from '@/lib/models';

export async function GET(request: NextRequest) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(new URL('/login?error=auth_failed', appUrl));
    }

    try {
        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${appUrl}/api/auth/google/callback`
        );

        // Exchange authorization code for tokens
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Verify the ID token and extract user info
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return NextResponse.redirect(new URL('/login?error=no_email', appUrl));
        }

        // Create or update user in database
        await dbConnect();
        const user = await User.findOneAndUpdate(
            { email: payload.email },
            {
                $set: {
                    name: payload.name || payload.email,
                    picture: payload.picture || '',
                },
                $setOnInsert: {
                    email: payload.email,
                    createdAt: Date.now(),
                },
            },
            { upsert: true, new: true }
        );

        // If new user, create a default shopping list
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

        // Create session cookie
        // Create session cookie
        const { token, cookieOptions } = await createSession({
            userId: user._id.toString(),
            email: user.email,
            name: user.name || user.email,
            picture: user.picture || '',
        });

        const response = NextResponse.redirect(new URL('/', appUrl));
        response.cookies.set('session', token, cookieOptions);
        return response;
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return NextResponse.redirect(new URL('/login?error=callback_failed', appUrl));
    }
}
