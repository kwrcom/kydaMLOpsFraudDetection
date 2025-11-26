"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, ShieldCheck, Activity, DollarSign } from 'lucide-react';

// Types for our data
interface Transaction {
  transaction_id: string;
  timestamp: string;
  amount: number;
  is_fraud: number;
  pred_proba: number;
  merchant_category: string;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    fraud: 0,
    fraudRate: 0,
    volume: 0
  });

  // Simulate real-time data feed
  useEffect(() => {
    // Initial mock data
    const initialData = Array.from({ length: 10 }).map((_, i) => generateMockTransaction(i));
    setTransactions(initialData);

    const interval = setInterval(() => {
      const newTxn = generateMockTransaction(Date.now());
      setTransactions(prev => {
        const updated = [newTxn, ...prev].slice(0, 50); // Keep last 50
        updateStats(updated);
        return updated;
      });
    }, 2000); // New transaction every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const updateStats = (txns: Transaction[]) => {
    const total = txns.length;
    const fraud = txns.filter(t => t.pred_proba > 0.5).length;
    const volume = txns.reduce((acc, t) => acc + t.amount, 0);

    setStats({
      total,
      fraud,
      fraudRate: total > 0 ? (fraud / total) * 100 : 0,
      volume
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Anti-Fraud Monitor</h1>
            <p className="text-slate-500">Real-time transaction analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-600">Live System</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-slate-500">Last 50 processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fraud Detected</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.fraud}</div>
              <p className="text-xs text-slate-500">High risk alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fraud Rate</CardTitle>
              <ShieldCheck className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fraudRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-500">Current batch risk</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.volume.toLocaleString()}</div>
              <p className="text-xs text-slate-500">Total processed amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Transactions List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.transaction_id} className={txn.pred_proba > 0.8 ? "bg-red-50" : ""}>
                      <TableCell className="font-mono text-xs">{txn.transaction_id.slice(0, 8)}...</TableCell>
                      <TableCell>{new Date(txn.timestamp).toLocaleTimeString()}</TableCell>
                      <TableCell>${txn.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{txn.merchant_category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getRiskColor(txn.pred_proba)}`}
                              style={{ width: `${txn.pred_proba * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{(txn.pred_proba * 100).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {txn.pred_proba > 0.5 ? (
                          <Badge variant="destructive">Fraud</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Legit</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Live Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...transactions].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="timestamp" tick={false} />
                    <YAxis domain={[0, 1]} />
                    <Tooltip
                      labelFormatter={() => ''}
                      formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Risk Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="pred_proba"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>System Status</AlertTitle>
                  <AlertDescription>
                    Monitoring active. ML Model v1.0.2 running in production.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper to generate mock data
function generateMockTransaction(seed: number): Transaction {
  const isFraud = Math.random() > 0.85; // 15% fraud chance for demo
  return {
    transaction_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    amount: Math.floor(Math.random() * 1000) + 10,
    is_fraud: isFraud ? 1 : 0,
    pred_proba: isFraud ? 0.5 + (Math.random() * 0.5) : Math.random() * 0.4,
    merchant_category: ['electronics', 'groceries', 'travel', 'digital_goods'][Math.floor(Math.random() * 4)]
  };
}

function getRiskColor(prob: number) {
  if (prob > 0.8) return "bg-red-600";
  if (prob > 0.5) return "bg-orange-500";
  return "bg-green-500";
}
