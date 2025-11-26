import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Disable caching for this dynamic route
export const dynamic = 'force-dynamic';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

export async function GET() {
    try {
        // Fetch last 20 predictions
        const rawList = await redis.lrange('recent_predictions', 0, 19);

        const predictions = rawList.map((item) => {
            try {
                return JSON.parse(item);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error('Redis error:', error);
        return NextResponse.json({ error: 'Redis error' }, { status: 500 });
    }
}
