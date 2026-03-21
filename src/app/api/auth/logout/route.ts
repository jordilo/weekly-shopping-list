import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
    const { token, cookieOptions } = await clearSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, cookieOptions);
    return response;
}
