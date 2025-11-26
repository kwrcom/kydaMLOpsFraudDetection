import { NextResponse } from 'next/server';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

export async function GET() {
    try {
        const rawList = await redis.lrange('recent_predictions', 0, 19);

        const predictions = rawList.map((item: string) => {
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
