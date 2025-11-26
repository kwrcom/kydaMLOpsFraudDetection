"use client";

import React from 'react';

export type TimeRangeKey = '5m' | '1h' | '24h' | '7d' | 'custom';

export default function FiltersPanel({
    timeRange,
    onTimeRangeChange,
    status,
    setStatus,
    amountRange,
    setAmountRange,
    query,
    setQuery,
}: {
    timeRange: TimeRangeKey;
    onTimeRangeChange: (k: TimeRangeKey) => void;
    status: string;
    setStatus: (s: string) => void;
    amountRange: [number, number];
    setAmountRange: (r: [number, number]) => void;
    query: string;
    setQuery: (q: string) => void;
}) {
    return (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <strong>Time</strong>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button onClick={() => onTimeRangeChange('5m')} style={{ padding: '.4rem .6rem' }} className={timeRange === '5m' ? 'active' : ''}>5m</button>
                        <button onClick={() => onTimeRangeChange('1h')} style={{ padding: '.4rem .6rem' }} className={timeRange === '1h' ? 'active' : ''}>1h</button>
                        <button onClick={() => onTimeRangeChange('24h')} style={{ padding: '.4rem .6rem' }} className={timeRange === '24h' ? 'active' : ''}>24h</button>
                        <button onClick={() => onTimeRangeChange('7d')} style={{ padding: '.4rem .6rem' }} className={timeRange === '7d' ? 'active' : ''}>7d</button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <strong>Status</strong>
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="all">All</option>
                        <option value="fraud">Fraud</option>
                        <option value="ok">OK</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <strong>Amount</strong>
                    <input type="number" value={amountRange[0]} onChange={e => setAmountRange([Number(e.target.value || 0), amountRange[1]])} placeholder="min" style={{ width: 80 }} />
                    <input type="number" value={amountRange[1]} onChange={e => setAmountRange([amountRange[0], Number(e.target.value || 0)])} placeholder="max" style={{ width: 80 }} />
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <input type="search" placeholder="Search transaction_id" value={query} onChange={e => setQuery(e.target.value)} />
                    <button onClick={() => { setQuery(''); setStatus('all'); setAmountRange([0, 0]); onTimeRangeChange('1h'); }}>Reset</button>
                </div>
            </div>
        </div>
    );
}
