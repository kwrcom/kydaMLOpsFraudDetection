import { NextResponse } from 'next/server';

const MLFLOW = process.env.MLFLOW_TRACKING_URI || 'http://mlflow:5000';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const name = url.searchParams.get('name');

        if (name) {
            const resp = await fetch(`${MLFLOW}/api/2.0/mlflow/registered-models/get?name=${encodeURIComponent(name)}`);
            if (!resp.ok) {
                return NextResponse.json({ error: 'failed to fetch model details', status: resp.status }, { status: 502 });
            }
            const json = await resp.json();
            return NextResponse.json(json);
        }

        // list all registered models
        const resp = await fetch(`${MLFLOW}/api/2.0/mlflow/registered-models/list`);
        if (!resp.ok) return NextResponse.json({ error: 'failed to list models' }, { status: 502 });
        const json = await resp.json();
        return NextResponse.json(json);
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 });
    }
}
