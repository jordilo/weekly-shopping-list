import mongoose from 'mongoose';

const MONGODB_URI = process.env.PROD_MONGODB_URI_MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
        // In production (build time), we might not have the URI yet if it's just building static pages
        // However, for API routes, it IS required.
        // Next.js build tries to statically analyze routes.
        // Let's warn instead of throw, but ensure connect fails clearly if called.
        console.warn('Neither PROD_MONGODB_URI_MONGODB_URI nor MONGODB_URI is defined. DB connection will fail.');
    } else {
        throw new Error(
            'Please define the MONGODB_URI or PROD_MONGODB_URI_MONGODB_URI environment variable inside .env.local'
        );
    }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalMongoose {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: GlobalMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached!.conn) {
        return cached!.conn;
    }

    if (!cached!.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 1, // Limit connections in serverless environment to prevent exhaustion
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached!.conn = await cached!.promise;
    } catch (e) {
        cached!.promise = null;
        throw e;
    }

    return cached!.conn;
}

export default dbConnect;
