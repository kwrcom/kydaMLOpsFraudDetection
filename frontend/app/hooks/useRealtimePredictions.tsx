"use client";

import { useEffect, useRef, useState } from 'react';

export type Prediction = {
    transaction_id: string;
    timestamp: string; // ISO string
    amount: number;
    pred_proba: number; // 0.0 - 1.0
    pred_label: number; // 0 or 1
    [k: string]: any;
};

export function useRealtimePredictions(pollInterval = 2000) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        async function fetchLatest() {
            try {
                const res = await fetch('/api/predictions');
                if (!res.ok) return;
                const data = await res.json();
                if (data?.predictions && Array.isArray(data.predictions)) {
                    // keep recent predictions deduplciated by transaction_id
                    setPredictions(prev => {
                        const merged = [...data.predictions, ...prev];
                        // unique by transaction_id
                        const seen = new Set<string>();
                        const uniq: Prediction[] = [];
                        for (const p of merged) {
                            if (!p || !p.transaction_id) continue;
                            if (!seen.has(p.transaction_id)) {
                                seen.add(p.transaction_id);
                                uniq.push(p);
                            }
                        }
                        // keep up to 1000 items
                        return uniq.slice(0, 1000);
                    });
                }
            } catch (e) {
                // silent
                // console.error(e);
            }
        }

        fetchLatest();
        const t = setInterval(fetchLatest, pollInterval);
        return () => {
            mountedRef.current = false;
            clearInterval(t);
        };
    }, [pollInterval]);

    // helper: aggregated by minute for last N minutes
    function aggregateFraudRate(minutes = 60) {
        const now = Date.now();
        const msWindow = minutes * 60 * 1000;
        const buckets = new Map<number, { total: number; fraud: number }>();

        for (const p of predictions) {
            const ts = Date.parse(p.timestamp);
            if (isNaN(ts)) continue;
            if (now - ts > msWindow) continue;
            const minute = Math.floor(ts / 60000) * 60000;
            const cur = buckets.get(minute) ?? { total: 0, fraud: 0 };
            cur.total += 1;
            if (p.pred_label === 1) cur.fraud += 1;
            buckets.set(minute, cur);
        }

        const points: { t: number; total: number; fraud: number; rate: number }[] = [];
        // fill from old -> newest
        const start = now - msWindow;
        for (let t = start; t <= now; t += 60 * 1000) {
            const bucket = buckets.get(Math.floor(t / 60000) * 60000) || { total: 0, fraud: 0 };
            const rate = bucket.total === 0 ? 0 : bucket.fraud / bucket.total;
            points.push({ t, total: bucket.total, fraud: bucket.fraud, rate });
        }

        return points;
    }

    function getHistogramData(seconds = 3600) {
        const now = Date.now();
        const cutoff = now - seconds * 1000;
        const amounts = predictions
            .filter(p => Date.parse(p.timestamp) >= cutoff)
            .map(p => p.amount)
            .filter(a => typeof a === 'number');

        return amounts;
    }

    return { predictions, aggregateFraudRate, getHistogramData };
}
