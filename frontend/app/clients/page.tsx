/**
 * Clients Page
 * Displays the clients dashboard with AI fraud check functionality
 */
'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/sidebar';
import { ClientsDashboard } from '@/components/clients-dashboard';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
    const { user, loading, logout, isAuthenticated } = useAuth();
    const router = useRouter();

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Загрузка...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        router.push('/auth/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">K</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Kyda.AI</h1>
                    </div>
                    <Button onClick={logout} variant="outline">
                        Выйти
                    </Button>
                </div>
            </header>

            {/* Main layout with sidebar */}
            <div className="flex">
                <Sidebar />

                {/* Main content */}
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-12">
                    {/* Welcome section */}
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">
                            Клиенты 👥
                        </h2>
                        <p className="text-lg text-gray-600">
                            Мониторинг клиентов и проверка на мошенничество
                        </p>
                    </div>

                    {/* Clients Dashboard */}
                    <ClientsDashboard />
                </main>
            </div>
        </div>
    );
}
