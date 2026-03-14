import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

// Routes that don't require authentication
const PUBLIC_PATHS = [
    '/login',
    '/api/auth',
];

// Static file extensions to skip
const STATIC_EXTENSIONS = ['.ico', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.woff', '.woff2', '.css', '.js', '.json'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip static assets and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/icons') ||
        STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))
    ) {
        return NextResponse.next();
    }

    // Skip public paths
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check for valid session
    const session = await getSessionFromRequest(request);

    if (!session) {
        // For API routes, return 401
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // For pages, redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes except static files
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
