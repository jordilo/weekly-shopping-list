import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await User.findById(session.userId).lean() as any;

    return NextResponse.json({
        userId: session.userId,
        email: session.email,
        name: session.name,
        picture: session.picture,
        language: user?.language || 'en',
        defaultListId: user?.defaultListId?.toString() || null,
    });
}
