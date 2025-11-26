/**
 * Sidebar Navigation Component
 * Provides navigation between different pages in the application
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        {
            name: 'Дашборд',
            href: '/',
            icon: '📊',
        },
        {
            name: 'Транзакции',
            href: '/transactions',
            icon: '💳',
        },
        {
            name: 'Клиенты',
            href: '/clients',
            icon: '👥',
        },
    ];

    return (
        <aside
            className={cn(
                'w-64 bg-white border-r border-gray-200 flex flex-col',
                className
            )}
        >
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                            )}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
