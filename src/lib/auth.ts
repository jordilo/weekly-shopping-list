import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

interface SessionPayload {
    userId: string;
    email: string;
    name: string;
    picture: string;
}

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    return new TextEncoder().encode(secret);
}

/**
 * Creates a signed JWT session token and sets it as an HttpOnly cookie.
 */
export async function createSession(payload: SessionPayload) {
    const token = await new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE}s`)
        .sign(getJwtSecret());

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: SESSION_MAX_AGE,
        path: '/',
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, cookieOptions);

    return { token, cookieOptions };
}

/**
 * Reads the session cookie and verifies the JWT.
 * Returns the session payload or null if invalid/missing.
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

/**
 * Gets the session from a NextRequest (for middleware usage where cookies() is not available).
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as unknown as SessionPayload;
    } catch {
        return null;
    }
}

/**
 * Clears the session cookie.
 */
export async function clearSession() {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        path: '/',
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, '', cookieOptions);

    return { token: '', cookieOptions };
}

/**
 * Requires authentication — returns session or throws a 401 response.
 * Use in API routes: const session = await requireAuth();
 */
export async function requireAuth(): Promise<SessionPayload> {
    const session = await getSession();
    if (!session) {
        throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    return session;
}
