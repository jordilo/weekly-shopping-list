import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { History } from '@/lib/models';

export async function GET() {
    await dbConnect();
    try {
        const history = await History.find({}).sort({ name: 1 });
        // Return objects { name, category }
        return NextResponse.json(history.map(h => ({ name: h.name, category: h.category })));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const { name, category } = await request.json();
        // Use upsert to prevent duplicates/errors
        if (name) {
            // Always update category to the latest one used
            await History.updateOne(
                { name: name },
                { $set: { name: name, category: category } },
                { upsert: true }
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
    }
}
