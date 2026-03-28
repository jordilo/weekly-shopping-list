"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBasket, List, Tags, Settings, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';

export function BottomNavbar() {
    const pathname = usePathname();
    const { lists } = useShoppingList();

    // Don't show on login page
    if (pathname === '/login') return null;

    const navItems = [
        { label: 'Shop', href: '/', icon: ShoppingBasket },
        { label: 'Items', href: '/items', icon: List },
        { label: 'Lists', href: '/lists', icon: ClipboardList },
        { label: 'Categories', href: '/categories', icon: Tags },
        { label: 'Settings', href: '/settings', icon: Settings },
    ];

    const totalPending = lists.reduce((sum, list) => sum + (list.pendingCount || 0), 0);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:mx-auto sm:bottom-4 sm:rounded-full sm:border sm:shadow-lg">
            <div className="flex justify-around items-center h-[49px]">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const isShop = item.href === '/';

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
                                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            )}
                        >
                            <div className="relative">
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                {isShop && totalPending > 0 && (
                                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-white dark:border-gray-900">
                                        {totalPending > 99 ? '99+' : totalPending}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
