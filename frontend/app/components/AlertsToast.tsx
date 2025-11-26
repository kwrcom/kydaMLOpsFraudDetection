"use client";

import React, { useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Prediction } from '../hooks/useRealtimePredictions';

export default function AlertsToast({ preds, threshold = 0.9 }: { preds: Prediction[]; threshold?: number }) {
    const seenRef = useRef(new Set<string>());

    useEffect(() => {
        for (const p of preds) {
            if (!p || !p.transaction_id) continue;
            if (seenRef.current.has(p.transaction_id)) continue;
            // show toast when fraud probability above threshold
            if (p.pred_proba >= threshold) {
                toast.warn(`🚨 High-risk txn ${p.transaction_id} (${(p.pred_proba * 100).toFixed(1)}%)`, { autoClose: 8000 });
            }
            seenRef.current.add(p.transaction_id);
            // Keep set size reasonable
            if (seenRef.current.size > 1000) {
                // prune oldest by re-creating the set from newest preds
                seenRef.current.clear();
                for (const q of preds.slice(0, 500)) seenRef.current.add(q.transaction_id);
            }
        }
    }, [preds, threshold]);

    return <ToastContainer position="top-right" />;
}
