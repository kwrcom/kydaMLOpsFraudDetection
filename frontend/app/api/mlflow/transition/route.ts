import { NextResponse } from 'next/server';

const MLFLOW = process.env.MLFLOW_TRACKING_URI || 'http://mlflow:5000';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, version, stage, archive_existing_versions = true } = body;
        if (!name || !version || !stage) return NextResponse.json({ error: 'missing params' }, { status: 400 });

        const resp = await fetch(`${MLFLOW}/api/2.0/mlflow/model-versions/transition-stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, version: String(version), stage, archive_existing_versions }),
        });

        if (!resp.ok) {
            const txt = await resp.text();
            return NextResponse.json({ error: txt }, { status: resp.status });
        }

        const json = await resp.json();
        return NextResponse.json(json);
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 });
    }
}
