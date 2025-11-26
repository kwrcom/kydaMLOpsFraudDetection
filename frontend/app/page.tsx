'use client';

import React, { useEffect, useState } from 'react';

interface Stats {
  f1?: number;
  model?: string;
  status: 'ready' | 'initializing';
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
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);

      const predsRes = await fetch('/api/predictions');
      const predsData = await predsRes.json();
      if (predsData.predictions) {
        setPredictions(predsData.predictions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // Refresh every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">🛡️ Anti-Fraud MVP Dashboard</h1>
          <p className="text-gray-500">Real-time monitoring and model performance</p>
        </header>

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🏆 Model Performance</h2>
          {loading && !stats ? (
            <div className="animate-pulse h-16 bg-gray-100 rounded"></div>
          ) : stats?.status === 'initializing' ? (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
              <strong>System Initializing...</strong>
              <p>Waiting for the first training run to complete.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 font-medium uppercase">Best F1 Score</p>
                <p className="text-3xl font-bold text-green-700">{stats?.f1?.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-600 font-medium uppercase">Active Model</p>
                <p className="text-3xl font-bold text-indigo-700">{stats?.model}</p>
              </div>
            </div>
          )}
        </div>

        {/* Predictions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">⚡ Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Transaction ID</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Risk Score</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictions.map((txn, idx) => {
                  const isFraud = txn.pred_label === 1;
                  return (
                    <tr key={idx} className={`hover:bg-gray-50 transition-colors ${isFraud ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {new Date(txn.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                        {txn.transaction_id}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ${txn.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${txn.pred_proba > 0.8 ? 'bg-red-100 text-red-800' :
                            txn.pred_proba > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                          }`}>
                          {(txn.pred_proba * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isFraud ? (
                          <span className="text-red-600 font-bold flex items-center gap-1">
                            ⚠️ FRAUD
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {predictions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Waiting for transactions...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
