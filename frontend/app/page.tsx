'use client';

import { useEffect, useState } from "react";
import ErrorBoundary from "../components/ErrorBoundary";

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
                                    <p style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b" }}>{predictions.length}</p>
                                </div>
                                <div>
                                    <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Fraud Detected</p>
                                    <p style={{ fontSize: "1.75rem", fontWeight: "700", color: "#ef4444" }}>{predictions.filter(p => p.pred_label === 1).length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
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
                                    {predictions.map((txn, idx) => {
                                        const isFraud = txn.pred_label === 1;
                                        return (
                                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", background: isFraud ? "rgba(239, 68, 68, 0.03)" : "transparent", transition: "background 0.2s" }}>
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
                                    })}
                                    {predictions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Waiting for transactions...</td>
                                        </tr>
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
