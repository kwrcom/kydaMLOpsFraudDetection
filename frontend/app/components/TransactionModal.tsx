"use client";

import React from 'react';

export default function TransactionModal({
    txn,
    onClose,
}: {
    txn: any | null;
    onClose: () => void;
}) {
    if (!txn) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
            <div style={{ width: 900, maxWidth: '95%', background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 6px 30px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Transaction {txn.transaction_id}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 16 }}>✖</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem' }}>
                    <div>
                        <h4>Summary</h4>
                        <p><strong>Time:</strong> {new Date(txn.timestamp).toLocaleString()}</p>
                        <p><strong>Amount:</strong> ${txn.amount?.toFixed?.(2)}</p>
                        <p><strong>Risk score:</strong> {(txn.pred_proba * 100)?.toFixed?.(1)}%</p>
                        <p><strong>Label:</strong> {txn.pred_label === 1 ? 'FRAUD' : 'OK'}</p>
                    </div>
                    <div>
                        <h4>Model reasoning</h4>
                        <div style={{ padding: '0.5rem', border: '1px dashed #e6e6e6' }}>
                            <p style={{ margin: 0, color: '#64748b' }}>SHAP explanation placeholder</p>
                            <div style={{ marginTop: 8, height: 120, background: '#f8fafc', borderRadius: 6 }}>
                                {/* In production – render SHAP bars or force plot here */}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid #f1f1f1' }}>
                    <h4>All features used by the model</h4>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#1e293b' }}>{JSON.stringify(txn, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}
