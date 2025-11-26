"use client";

import React from 'react';
import AdminManualReviewQueue from '../../app/components/AdminManualReviewQueue';
import ModelComparison from '../../app/components/ModelComparison';

export default function AdminPage() {
    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <h1>Admin / Manual Review</h1>
            <p style={{ color: '#64748b' }}>Admin console to inspect flagged transactions, manage models and configure thresholds (scaffold).</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', marginTop: '1rem' }}>
                <AdminManualReviewQueue />
                <div>
                    <ModelComparison />
                </div>
            </div>
        </div>
    );
}
