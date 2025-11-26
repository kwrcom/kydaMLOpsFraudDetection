"use client";

import React from 'react';
import { Prediction } from '../../hooks/useRealtimePredictions';

function toHourDay(ts: string) {
    const d = new Date(ts);
    return { hour: d.getHours(), day: d.getDay() };
}

export default function HeatmapActivity({ preds }: { preds: Prediction[] }) {
    // Build 7 x 24 matrix [day][hour]
    const matrix: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const p of preds) {
        if (!p?.timestamp) continue;
        const { hour, day } = toHourDay(p.timestamp);
        matrix[day][hour] += 1;
    }

    return (
        <div className="card">
            <div style={{ padding: '1rem', borderBottom: '1px solid #e6eef6' }}>
                <h3 style={{ margin: 0 }}>Activity Heatmap (by day & hour)</h3>
            </div>
            <div style={{ padding: '1rem', overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '.5rem', textAlign: 'left' }}>Day / Hour</th>
                            {new Array(24).fill(0).map((_, i) => (
                                <th key={i} style={{ padding: '.25rem', width: '28px', textAlign: 'center' }}>{i}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label, dayIdx) => (
                            <tr key={dayIdx}>
                                <td style={{ padding: '.25rem', fontWeight: 700 }}>{label}</td>
                                {matrix[dayIdx].map((v, h) => (
                                    <td key={h} style={{ padding: '.25rem', textAlign: 'center' }}>
                                        <div style={{ width: 22, height: 14, background: `rgba(20,184,166, ${Math.min(1, v / 10)})`, borderRadius: 3 }} title={`${v} txns`} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
