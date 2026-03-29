import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';

export async function PUT(request: Request) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { language } = body;

        if (!language || !['en', 'es', 'ca'].includes(language)) {
            return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
        }

        await dbConnect();

        await User.findByIdAndUpdate(session.userId, { language });

        return NextResponse.json({ success: true, language });
    } catch (error) {
        console.error('Failed to update language', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
