/**
 * Transaction Dashboard Component
 * Displays a table of transactions with AI fraud check functionality
 * Each transaction can be checked for fraud with expandable details
 */
'use client';

import { useState, useEffect } from 'react';
import { Transaction, FraudAnalysis } from '@/types/transaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import apiClient from '@/lib/api';

export function TransactionDashboard() {
    // State to track which transactions have been checked and their analysis results
    const [checkedTransactions, setCheckedTransactions] = useState<Map<string, FraudAnalysis>>(new Map());
    // State to track which transaction details are expanded
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // State for transactions data and pagination
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20; // Items per page

    // Fetch transactions when page or search changes
    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const skip = page * limit;
                const [data, countData] = await Promise.all([
                    apiClient.getTransactions(skip, limit, search),
                    apiClient.getTransactionsCount(search)
                ]);
                setTransactions(data);
                setTotalCount(countData.count);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [page, search]);

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [search]);

    /**
     * Simulates AI fraud check
     */
    const handleAICheck = (transaction: Transaction) => {
        const key = `${transaction.cst_dim_id}-${transaction.docno}`;

        // Toggle expansion
        const newExpandedRows = new Set(expandedRows);
        if (expandedRows.has(key)) {
            newExpandedRows.delete(key);
        } else {
            newExpandedRows.add(key);

            // If not already checked, generate mock analysis
            if (!checkedTransactions.has(key)) {
                // Mock fraud analysis - in production this would come from API
                const mockAnalysis: FraudAnalysis = {
                    fraudProbability: Math.random() * 100,
                    dangerLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
                    falsePositiveProbability: Math.random() * 30,
                };

                setCheckedTransactions(new Map(checkedTransactions).set(key, mockAnalysis));
            }
        }

        setExpandedRows(newExpandedRows);
    };

    /**
     * Get danger level color for styling
     */
    const getDangerLevelColor = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'high':
                return 'text-red-600 bg-red-50';
            case 'medium':
                return 'text-orange-600 bg-orange-50';
            case 'low':
                return 'text-green-600 bg-green-50';
        }
    };

    /**
     * Get danger level text in Russian
     */
    const getDangerLevelText = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'high':
                return 'Высокий';
            case 'medium':
                return 'Средний';
            case 'low':
                return 'Низкий';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl">Список транзакций</CardTitle>
                        <CardDescription>
                            Просмотр и анализ транзакций ({totalCount} всего)
                        </CardDescription>
                    </div>
                    <div className="w-full md:w-64">
                        <Input
                            placeholder="Поиск по ID или документу..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <Alert>
                        <AlertDescription>
                            Нет данных для отображения. Попробуйте изменить параметры поиска.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Клиента</TableHead>
                                    <TableHead>Дата</TableHead>
                                    <TableHead>Время</TableHead>
                                    <TableHead>Сумма</TableHead>
                                    <TableHead>Документ</TableHead>
                                    <TableHead>Направление</TableHead>
                                    <TableHead className="text-center">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((transaction) => {
                                    const key = `${transaction.cst_dim_id}-${transaction.docno}`;
                                    const isExpanded = expandedRows.has(key);
                                    const analysis = checkedTransactions.get(key);

                                    return (
                                        <>
                                            <TableRow key={key}>
                                                <TableCell className="font-medium">{transaction.cst_dim_id}</TableCell>
                                                <TableCell>{transaction.transdate}</TableCell>
                                                <TableCell>{transaction.transdatetime}</TableCell>
                                                <TableCell>{Number(transaction.amount).toLocaleString('ru-RU')} ₸</TableCell>
                                                <TableCell>{transaction.docno}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.direction === 'CREDIT'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {transaction.direction}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant={isExpanded ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleAICheck(transaction)}
                                                    >
                                                        {isExpanded ? '🔍 Скрыть' : '🤖 Проверить'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && analysis && (
                                                <TableRow key={`${key}-details`}>
                                                    <TableCell colSpan={7} className="bg-muted/50">
                                                        <div className="py-4 px-2">
                                                            <h4 className="font-semibold text-lg mb-4">
                                                                Результаты проверки ИИ
                                                            </h4>
                                                            <div className="grid gap-4 md:grid-cols-3">
                                                                {/* Fraud Probability */}
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        Вероятность мошенничества
                                                                    </p>
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                            <div
                                                                                className={`h-2 rounded-full ${analysis.fraudProbability > 70
                                                                                        ? 'bg-red-500'
                                                                                        : analysis.fraudProbability > 40
                                                                                            ? 'bg-orange-500'
                                                                                            : 'bg-green-500'
                                                                                    }`}
                                                                                style={{ width: `${analysis.fraudProbability}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-lg font-bold">
                                                                            {analysis.fraudProbability.toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Danger Level */}
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        Уровень опасности
                                                                    </p>
                                                                    <div
                                                                        className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold ${getDangerLevelColor(
                                                                            analysis.dangerLevel
                                                                        )}`}
                                                                    >
                                                                        {getDangerLevelText(analysis.dangerLevel)}
                                                                    </div>
                                                                </div>

                                                                {/* False Positive Probability */}
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-medium text-muted-foreground">
                                                                        Вероятность ложного срабатывания
                                                                    </p>
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                            <div
                                                                                className="bg-blue-500 h-2 rounded-full"
                                                                                style={{
                                                                                    width: `${analysis.falsePositiveProbability}%`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-lg font-bold">
                                                                            {analysis.falsePositiveProbability.toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                Назад
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Страница {page + 1} из {Math.ceil(totalCount / limit)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * limit >= totalCount}
                            >
                                Вперед
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
