"use client";

import React, { useEffect, useState } from 'react';

type ModelInfo = {
    registered_model: {
        name: string;
        latest_versions?: Array<{ version: string; run_id: string; current_stage: string }>;
    };
};

export default function ModelComparison() {
    const [models, setModels] = useState<any[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [details, setDetails] = useState<ModelInfo | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch('/api/mlflow/models');
                const json = await res.json();
                const list = json.registered_models || json.models || [];
                setModels(list.map((m: any) => m.registered_model?.name || m.name || m));
                if (list.length > 0) setSelected(list[0].registered_model?.name || list[0].name);
            } catch (e) {
                // ignore
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (!selected) return;
        setLoading(true);
        fetch(`/api/mlflow/models?name=${encodeURIComponent(selected)}`).then(r => r.json()).then(j => {
            setDetails(j as ModelInfo);
        }).catch(() => setDetails(null)).finally(() => setLoading(false));
    }, [selected]);

    // live A/B stats from recent predictions (last 20)
    const [liveStats, setLiveStats] = useState<Record<string, { total: number; fraud: number; avgRisk: number }>>({});
    useEffect(() => {
        let cancelled = false;
        async function loadLive() {
            try {
                const res = await fetch('/api/predictions');
                const j = await res.json();
                const preds = j.predictions || [];
                const grouped: Record<string, { total: number; fraud: number; sumRisk: number }> = {};
                for (const p of preds) {
                    const v = p.model_version || 'unknown';
                    const g = grouped[v] ?? { total: 0, fraud: 0, sumRisk: 0 };
                    g.total += 1;
                    if (p.pred_label === 1) g.fraud += 1;
                    g.sumRisk += (p.pred_proba || 0);
                    grouped[v] = g;
                }
                const out: Record<string, any> = {};
                for (const k of Object.keys(grouped)) {
                    out[k] = { total: grouped[k].total, fraud: grouped[k].fraud, avgRisk: grouped[k].sumRisk / grouped[k].total };
                }
                if (!cancelled) setLiveStats(out);
            } catch (e) {
                // ignore
            }
        }
        loadLive();
        const t = setInterval(loadLive, 2000);
        return () => { cancelled = true; clearInterval(t); };
    }, []);

    async function transition(version: string, stage: string) {
        try {
            const res = await fetch('/api/mlflow/transition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: selected, version, stage, archive_existing_versions: true }),
            });
            const json = await res.json();
            console.log('transition result', json);
            // refresh
            fetch(`/api/mlflow/models?name=${encodeURIComponent(selected)}`).then(r => r.json()).then(j => setDetails(j as ModelInfo));
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="card">
            <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Model Management & A/B testing</h3>
            </div>
            <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ color: '#64748b' }}>Model</label>
                    <select value={selected ?? ''} onChange={e => setSelected(e.target.value)}>
                        <option value="">--</option>
                        {models.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                {loading && <div style={{ color: '#94a3b8' }}>Loading model details…</div>}

                {details?.registered_model?.latest_versions && (
                    <div>
                        <h4 style={{ marginTop: 0 }}>Versions</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: 12 }}>
                                    <th style={{ padding: 6 }}>Version</th>
                                    <th style={{ padding: 6 }}>Stage</th>
                                    <th style={{ padding: 6 }}>Run</th>
                                    <th style={{ padding: 6 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.registered_model.latest_versions?.map(v => (
                                    <tr key={v.version} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 8 }}>{v.version}</td>
                                        <td style={{ padding: 8 }}>{v.current_stage}</td>
                                        <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 12 }}>{v.run_id}</td>
                                        <td style={{ padding: 8 }}>
                                            <div style={{ fontSize: 12 }}>
                                                <div>Live: {liveStats[v.version]?.total ?? 0} txns</div>
                                                <div style={{ color: '#ef4444' }}>Fraud: {liveStats[v.version]?.fraud ?? 0}</div>
                                                <div>Avg risk: {((liveStats[v.version]?.avgRisk ?? 0) * 100).toFixed(1)}%</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            <button style={{ marginRight: 6 }} onClick={() => transition(v.version, 'Production')}>Promote</button>
                                            <button onClick={() => transition(v.version, 'Staging')}>Set Staging</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!details && !loading && <div style={{ color: '#94a3b8' }}>No model selected or no model details available.</div>}
            </div>
        </div>
    );
}
