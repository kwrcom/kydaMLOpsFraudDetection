"use client";

import React from 'react';
import {
    Chart as ChartJS,
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    type TooltipItem,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Point = { t: number; total: number; fraud: number; rate: number };

export default function LineChartFraudRate({ points }: { points: Point[] }) {
    const labels = points.map(p => p.t);
    const data = {
        labels,
        datasets: [
            {
                label: 'Fraud rate',
                data: points.map(p => +(p.rate * 100).toFixed(3)), // percent
                fill: true,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.9)',
                tension: 0.3,
            },
            {
                label: 'Transactions',
                data: points.map(p => p.total),
                yAxisID: 'yTrans',
                backgroundColor: 'rgba(99,102,241,0.08)',
                borderColor: 'rgba(99,102,241,0.9)',
                tension: 0.2,
                hidden: true,
            },
        ],
    };

    const options: any = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { type: 'time', time: { unit: 'minute' }, title: { display: false } },
            y: { title: { display: true, text: 'Fraud %' } },
            yTrans: { position: 'right', grid: { display: false }, title: { display: true, text: 'Transactions' } },
        },
        plugins: {
            tooltip: { callbacks: { label: (ctx: TooltipItem<'line'>) => `${ctx.dataset.label}: ${ctx.formattedValue}` } },
        },
    };

    return (
        <div className="card">
            <div style={{ padding: '1rem', borderBottom: '1px solid #e6eef6' }}>
                <h3 style={{ margin: 0 }}>Fraud Rate (real-time)</h3>
            </div>
            <div style={{ padding: '1rem', minHeight: 220 }}>
                <Line options={options} data={data} />
            </div>
        </div>
    );
}
