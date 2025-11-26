"use client";

import React from 'react';
import { useRealtimePredictions } from '../hooks/useRealtimePredictions';

export default function AdminManualReviewQueue() {
    const { predictions } = useRealtimePredictions(3000);

    const highRisk = predictions.filter(p => p.pred_proba >= 0.8).slice(0, 40);

    return (
        <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Manual Review Queue</h3>
                <small style={{ color: '#94a3b8' }}>{highRisk.length} items</small>
            </div>

            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                {highRisk.length === 0 && <div style={{ padding: 12, color: '#94a3b8' }}>No high-risk transactions right now.</div>}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {highRisk.map((t, i) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(t.timestamp).toLocaleTimeString()}</div>
                                <div style={{ fontFamily: 'monospace' }}>{t.transaction_id}</div>
                                <div style={{ fontWeight: 700 }}>${t.amount.toFixed(2)}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{ background: '#10b981', color: 'white', padding: '6px 8px', borderRadius: 6, border: 'none' }}>Approve</button>
                                <button style={{ background: '#ef4444', color: 'white', padding: '6px 8px', borderRadius: 6, border: 'none' }}>Block</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
