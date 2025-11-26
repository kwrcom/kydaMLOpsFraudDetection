/**
 * Clients Dashboard Component
 * Displays a table of clients with AI fraud check functionality
 * Each client can be checked for fraud with expandable details
 */
'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types/client';
import { FraudAnalysis } from '@/types/transaction';
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

// Extend Client type to include transaction_count if it's not already there
interface ClientWithTransactions extends Client {
    transaction_count?: number;
}

export function ClientsDashboard() {
    // State to track which clients have been checked and their analysis results
    const [checkedClients, setCheckedClients] = useState<Map<string, FraudAnalysis>>(new Map());
    // State to track which client details are expanded
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // State for clients data and pagination
    const [clients, setClients] = useState<ClientWithTransactions[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const limit = 20; // Items per page

    // Fetch clients when page or search changes
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const skip = page * limit;
                const [data, countData] = await Promise.all([
                    apiClient.getClients(skip, limit, search),
                    apiClient.getClientsCount(search)
                ]);
                setClients(data);
                setTotalCount(countData.count);
            } catch (error) {
                console.error('Error fetching clients:', error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchClients();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [page, search]);

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [search]);

    /**
     * Simulates AI fraud check for a client
     */
    const handleAICheck = (client: Client) => {
        const key = `${client.cst_dim_id}-${client.transdate}`;

        // Toggle expansion
        const newExpandedRows = new Set(expandedRows);
        if (expandedRows.has(key)) {
            newExpandedRows.delete(key);
        } else {
            newExpandedRows.add(key);

            // If not already checked, generate mock analysis
            if (!checkedClients.has(key)) {
                // Mock fraud analysis - in production this would come from API
                const mockAnalysis: FraudAnalysis = {
                    fraudProbability: Math.random() * 100,
                    dangerLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
                    falsePositiveProbability: Math.random() * 30,
                };

                setCheckedClients(new Map(checkedClients).set(key, mockAnalysis));
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
                        <CardTitle className="text-2xl">Клиенты</CardTitle>
                        <CardDescription>
                            Список клиентов ({totalCount} всего)
                        </CardDescription>
                    </div>
                    <div className="w-full md:w-64">
                        <Input
                            placeholder="Поиск по ID клиента..."
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
                ) : clients.length === 0 ? (
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
                                    <TableHead>Транзакции</TableHead>
                                    <TableHead>Логины (7д)</TableHead>
                                    <TableHead>Логины (30д)</TableHead>
                                    <TableHead>Модель телефона</TableHead>
                                    <TableHead>ОС</TableHead>
                                    <TableHead className="text-center">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.map((client) => {
                                    const key = `${client.cst_dim_id}-${client.transdate}`;
                                    const isExpanded = expandedRows.has(key);
                                    const analysis = checkedClients.get(key);

                                    return (
                                        <>
                                            <TableRow key={key}>
                                                <TableCell className="font-medium">{client.cst_dim_id}</TableCell>
                                                <TableCell>{client.transdate}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {client.transaction_count || 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{client.logins_last_7_days}</TableCell>
                                                <TableCell>{client.logins_last_30_days}</TableCell>
                                                <TableCell>{client.last_phone_model_categorical}</TableCell>
                                                <TableCell>{client.last_os_categorical}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant={isExpanded ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleAICheck(client)}
                                                    >
                                                        {isExpanded ? '🔍 Скрыть' : '🤖 Проверить'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && analysis && (
                                                <TableRow key={`${key}-details`}>
                                                    <TableCell colSpan={8} className="bg-muted/50">
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
