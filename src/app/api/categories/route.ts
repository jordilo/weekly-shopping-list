import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Category } from '@/lib/models';

export async function GET() {
    await dbConnect();
    try {
        const categories = await Category.find({}).sort({ order: 1, name: 1 });
        const formatted = categories.map(cat => ({
            id: cat._id.toString(),
            name: cat.name,
            order: cat.order
        }));
        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const category = await Category.create({
            name: body.name.trim(),
            order: body.order || 0
        });

        return NextResponse.json({
            id: category._id.toString(),
            name: category.name,
            order: category.order
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
