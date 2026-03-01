"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBasket, List, Tags, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavbar() {
    const pathname = usePathname();

    const navItems = [
        { label: 'List', href: '/', icon: ShoppingBasket },
        { label: 'Items', href: '/items', icon: List },
        { label: 'Categories', href: '/categories', icon: Tags },
        { label: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)] sm:max-w-md sm:mx-auto sm:bottom-4 sm:rounded-full sm:border sm:shadow-lg">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            )}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
