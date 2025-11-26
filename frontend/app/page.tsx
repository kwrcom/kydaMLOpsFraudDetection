'use client';

import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { useRealtimePredictions } from "./hooks/useRealtimePredictions";
import LineChartFraudRate from './components/charts/LineChartFraudRate';
import HistogramAmount from './components/charts/HistogramAmount';
import HeatmapActivity from './components/charts/HeatmapActivity';
import MapTransactions from './components/MapTransactions';
import AlertsToast from './components/AlertsToast';
import TransactionModal from './components/TransactionModal';
import FiltersPanel from './components/FiltersPanel';

interface Stats {
    f1?: number;
    model?: string;
    status: "ready" | "initializing";
}

interface Transaction {
    transaction_id: string;
    timestamp: string;
    amount: number;
    pred_proba: number;
    pred_label: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [predictions, setPredictions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsRes, predsRes] = await Promise.all([
                fetch("/api/stats"),
                fetch("/api/predictions"),
            ]);
            const statsData = await statsRes.json();
            const predsData = await predsRes.json();
            setStats(statsData);
            if (predsData.predictions) {
                setPredictions(predsData.predictions);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    // Realtime hook: polls /api/predictions and keeps a recent window
    const { predictions: realtimePreds, aggregateFraudRate, getHistogramData } = useRealtimePredictions(2000);
    const [timeRange, setTimeRange] = useState<'5m' | '1h' | '24h' | '7d' | 'custom'>('1h');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [amountRange, setAmountRange] = useState<[number, number]>([0, 0]);
    const [query, setQuery] = useState<string>('');
    const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

    // Precompute filtered dataset derived from realtime predictions
    const nowMs = Date.now();
    let filteredData = realtimePreds.slice();
    let secondsCut = 60 * 60;
    if (timeRange === '5m') secondsCut = 5 * 60;
    if (timeRange === '1h') secondsCut = 60 * 60;
    if (timeRange === '24h') secondsCut = 24 * 60 * 60;
    if (timeRange === '7d') secondsCut = 7 * 24 * 60 * 60;

    filteredData = filteredData.filter(p => {
        const ts = Date.parse(p.timestamp);
        if (isNaN(ts)) return false;
        if ((nowMs - ts) / 1000 > secondsCut) return false;
        if (statusFilter === 'fraud' && p.pred_label !== 1) return false;
        if (statusFilter === 'ok' && p.pred_label !== 0) return false;
        if (amountRange[0] > 0 && p.amount < amountRange[0]) return false;
        if (amountRange[1] > 0 && p.amount > amountRange[1]) return false;
        if (query && !p.transaction_id.includes(query)) return false;
        return true;
    });

    // Loading UI – show a simple spinner while initial data is loading
    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                Loading dashboard data…
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div style={{ minHeight: "100vh", padding: "2rem" }}>
                <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                    {/* Header */}
                    <header style={{ marginBottom: "3rem" }}>
                        <h1 className="gradient-text" style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "0.5rem" }}>
                            🛡️ Fraud Detection System
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
                            Real-time ML-powered transaction monitoring
                        </p>
                        <div style={{ marginTop: 8 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
                                <strong>Live alerts:</strong>
                                <span style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: 20, fontWeight: 700 }}>{realtimePreds.filter(p => p.pred_proba >= 0.9).length}</span>
                            </span>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                        {/* Model Performance Card */}
                        <div className="card" style={{ padding: "2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                                <div style={{ fontSize: "2rem", marginRight: "0.75rem" }}>🏆</div>
                                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b" }}>Model Performance</h2>
                            </div>
                            {stats?.status === "initializing" ? (
                                <div style={{ padding: "1rem", background: "rgba(59, 130, 246, 0.1)", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                                    <p style={{ color: "#2563eb", fontWeight: "600" }}>⏳ System Initializing...</p>
                                    <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>Waiting for first training run</p>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>F1 Score</p>
                                        <p style={{ fontSize: "2.5rem", fontWeight: "800", color: "#10b981" }}>{stats?.f1?.toFixed(4)}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Active Model</p>
                                        <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "#6366f1" }}>{stats?.model}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Live Stats Card */}
                        <div className="card" style={{ padding: "2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                                <div style={{ fontSize: "2rem", marginRight: "0.75rem" }}>📊</div>
                                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b" }}>Live Statistics</h2>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div>
                                    <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Total Checked</p>
                                    <p style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b" }}>{realtimePreds.length}</p>
                                </div>
                                <div>
                                    <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Fraud Detected</p>
                                    <p style={{ fontSize: "1.75rem", fontWeight: "700", color: "#ef4444" }}>{realtimePreds.filter(p => p.pred_label === 1).length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visualizations */}
                    <FiltersPanel
                        timeRange={timeRange}
                        onTimeRangeChange={(k) => setTimeRange(k)}
                        status={statusFilter}
                        setStatus={setStatusFilter}
                        amountRange={amountRange}
                        setAmountRange={setAmountRange}
                        query={query}
                        setQuery={setQuery}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', marginBottom: '2rem' }}>
                        <LineChartFraudRate points={aggregateFraudRate(60)} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <HistogramAmount amounts={getHistogramData(60 * 60)} />
                                <HeatmapActivity preds={realtimePreds} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <MapTransactions preds={realtimePreds} />
                    </div>

                    {/* Transactions Table */}
                    <TransactionModal txn={selectedTxn} onClose={() => setSelectedTxn(null)} />

                    {/* Alerts: show toast notifications for high risk (>= 0.9) */}
                    <AlertsToast preds={realtimePreds} threshold={0.9} />
                    <div className="card" style={{ overflow: "hidden" }}>
                        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b" }}>⚡ Recent Transactions</h2>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead style={{ background: "#f8fafc" }}>
                                    <tr>
                                        <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Time</th>
                                        <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transaction ID</th>
                                        <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Amount</th>
                                        <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Risk Score</th>
                                        <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Waiting for transactions...</td>
                                        </tr>
                                    ) : (
                                        filteredData.map((txn, idx) => {
                                            const isFraud = txn.pred_label === 1;
                                            return (
                                                <tr key={idx} onClick={() => setSelectedTxn(txn)} style={{ cursor: 'pointer', borderBottom: "1px solid #f1f5f9", background: isFraud ? "rgba(239, 68, 68, 0.03)" : "transparent", transition: "background 0.2s" }}>
                                                    <td style={{ padding: "1rem", color: "#64748b", fontSize: "0.875rem" }}>{new Date(txn.timestamp).toLocaleTimeString()}</td>
                                                    <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#64748b" }}>{txn.transaction_id}</td>
                                                    <td style={{ padding: "1rem", fontWeight: "600", color: "#1e293b" }}>${txn.amount.toFixed(2)}</td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <span className={`badge ${txn.pred_proba > 0.8 ? "badge-danger" : txn.pred_proba > 0.5 ? "badge-warning" : "badge-success"}`}>
                                                            {(txn.pred_proba * 100).toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        {isFraud ? (
                                                            <span style={{ color: "#ef4444", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.25rem" }}>⚠️ FRAUD</span>
                                                        ) : (
                                                            <span style={{ color: "#10b981", fontWeight: "600" }}>✓ OK</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
}
