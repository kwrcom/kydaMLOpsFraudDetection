"use client";

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function HistogramAmount({ amounts }: { amounts: number[] }) {
    // Build simple buckets for histogram
    if (!amounts.length) {
        return (
            <div className="card" style={{ padding: '1rem' }}>
                <h3>Transaction Amounts</h3>
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Нет данных</div>
            </div>
        );
    }

    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const buckets = 12;
    const width = (max - min) / buckets || 1;
    const labels: string[] = [];
    const counts: number[] = new Array(buckets).fill(0);

    for (let i = 0; i < buckets; i++) {
        labels.push(`${(min + i * width).toFixed(0)}-${(min + (i + 1) * width).toFixed(0)}`);
    }

    for (const a of amounts) {
        const idx = Math.min(Math.floor((a - min) / width), buckets - 1);
        counts[idx] += 1;
    }

    const data = {
        labels,
        datasets: [
            {
                label: 'Count',
                data: counts,
                backgroundColor: 'rgba(16,185,129,0.8)',
            },
        ],
    };

    return (
        <div className="card">
            <div style={{ padding: '1rem', borderBottom: '1px solid #e6eef6' }}>
                <h3 style={{ margin: 0 }}>Distribution of Transaction Amounts</h3>
            </div>
            <div style={{ padding: '1rem', minHeight: 220 }}>
                <Bar data={data} />
            </div>
        </div>
    );
}
