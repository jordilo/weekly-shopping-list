import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Meta } from '@/lib/models';

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

    try {
        const meta = await Meta.findOne({ key });
        return NextResponse.json({ value: meta ? meta.value : null });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch meta' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const { key, value } = await request.json();
        const meta = await Meta.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        return NextResponse.json({ value: meta.value });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save meta' }, { status: 500 });
    }
}
