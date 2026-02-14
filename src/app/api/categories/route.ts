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
    } catch {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const { name } = await request.json();
        const newCategory = await Category.create({ name });
        return NextResponse.json({
            id: newCategory._id,
            name: newCategory.name,
            order: newCategory.order
        });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
