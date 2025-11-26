/**
 * Dashboard Component
 * Displays system overview with statistics and status
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/lib/api';

interface DashboardStats {
    total_transactions: number;
    total_clients: number;
    system_status: string;
    last_update: string;
}

export function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        total_transactions: 0,
        total_clients: 0,
        system_status: 'active',
        last_update: new Date().toLocaleString('ru-RU'),
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiClient.getDashboardStats();
                setStats({
                    ...data,
                    last_update: new Date(data.last_update).toLocaleString('ru-RU'),
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* System Status Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Статус системы</CardTitle>
                        <div className="text-2xl">⚡</div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-2xl font-bold text-green-700">
                                {stats.system_status === 'active' ? 'Активна' : 'Неактивна'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Последнее обновление: {stats.last_update}
                        </p>
                    </CardContent>
                </Card>

                {/* Transactions Count Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Количество транзакций</CardTitle>
                        <div className="text-2xl">💳</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.total_transactions.toLocaleString('ru-RU')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Всего транзакций в системе
                        </p>
                    </CardContent>
                </Card>

                {/* Clients Count Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Количество клиентов</CardTitle>
                        <div className="text-2xl">👥</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? '...' : stats.total_clients.toLocaleString('ru-RU')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Всего клиентов в системе
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* System Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Информация о системе</CardTitle>
                    <CardDescription>
                        Обзор возможностей платформы мониторинга мошенничества
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600">🤖</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">ИИ проверка мошенничества</h4>
                                <p className="text-sm text-gray-600">
                                    Автоматическая проверка транзакций и клиентов с помощью искусственного интеллекта
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600">📊</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Аналитика в реальном времени</h4>
                                <p className="text-sm text-gray-600">
                                    Мониторинг транзакций и поведения клиентов в режиме реального времени
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-green-600">🔒</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Безопасность данных</h4>
                                <p className="text-sm text-gray-600">
                                    Защищенное хранение и обработка конфиденциальной информации
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-orange-600">⚡</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Быстрая обработка</h4>
                                <p className="text-sm text-gray-600">
                                    Высокая скорость анализа больших объемов данных
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
