"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Settings, LogOut, ChevronDown, RefreshCw, PlusCircle, ArrowLeft } from 'lucide-react';
import { useShoppingList } from '@/lib/hooks/use-shopping-list';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useIntl, FormattedMessage } from 'react-intl';

export function Header() {
    const { 
        lists, 
        activeListId, 
        activeList, 
        setActiveListId, 
        weekStartDate,
        refresh,
        resetList,
        isLoaded
    } = useShoppingList();
    
    const [showMenu, setShowMenu] = useState(false);
    const [showListPicker, setShowListPicker] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const intl = useIntl();

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowListPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (pathname === '/login') return null;

    const formattedDate = new Intl.DateTimeFormat(intl.locale, { month: 'short', day: 'numeric' }).format(weekStartDate);

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                router.push('/login');
                router.refresh();
            }
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const isHome = pathname === '/';
    
    const pageTitles: Record<string, string> = {
        '/items': intl.formatMessage({ id: 'page.manageItems', defaultMessage: 'Manage Items' }),
        '/categories': intl.formatMessage({ id: 'page.manageCategories', defaultMessage: 'Manage Categories' }),
        '/lists': intl.formatMessage({ id: 'page.shoppingLists', defaultMessage: 'Shopping Lists' }),
        '/settings': intl.formatMessage({ id: 'page.settings', defaultMessage: 'Settings' }),
    };

    let currentTitle = pageTitles[pathname] || '';
    if (!currentTitle && pathname.startsWith('/lists/') && pathname.endsWith('/settings')) {
        currentTitle = intl.formatMessage({ id: 'page.listSettings', defaultMessage: 'List Settings' });
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {!isHome ? (
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                            aria-label={intl.formatMessage({ id: 'action.back', defaultMessage: 'Back' })}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {currentTitle}
                        </h1>
                    </div>
                ) : (
                    <>
                        {/* App Icon */}
                        <Link href="/" className="flex-shrink-0">
                            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                                <Image
                                    src="/icons/icon.svg"
                                    alt="Logo"
                                    width={18}
                                    height={18}
                                    className="object-contain"
                                />
                            </div>
                        </Link>

                        {/* List Name or Selector */}
                        <div className="flex flex-col min-w-0">
                            {!isLoaded ? (
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                            ) : lists.length > 1 ? (
                                <div className="relative" ref={pickerRef}>
                                    <button
                                        onClick={() => setShowListPicker(!showListPicker)}
                                        className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
                                        id="list-selector"
                                    >
                                        <span className="truncate">{activeList?.name || intl.formatMessage({ id: 'header.selectList', defaultMessage: 'Select List' })}</span>
                                        <ChevronDown size={14} className={cn("transition-transform flex-shrink-0", showListPicker && "rotate-180")} />
                                    </button>
                                    
                                    {showListPicker && (
                                        <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 py-1 z-50">
                                            {lists.map(list => (
                                                <button
                                                    key={list.id}
                                                    onClick={() => {
                                                        setActiveListId(list.id);
                                                        setShowListPicker(false);
                                                        if (pathname === '/') {
                                                            router.replace(`/?listId=${list.id}`, { scroll: false });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2",
                                                        list.id === activeListId
                                                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-medium"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    )}
                                                >
                                                    <span className="truncate">{list.name}</span>
                                                    {list.pendingCount > 0 && (
                                                        <span className={cn(
                                                            "flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-bold",
                                                            list.id === activeListId
                                                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                        )}>
                                                            {list.pendingCount}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {activeList?.name || intl.formatMessage({ id: 'header.weeklyShop', defaultMessage: 'Weekly Shop' })}
                                </span>
                            )}
                            {isLoaded && (
                                <span 
                                    className="text-[10px] text-gray-500 dark:text-gray-400 leading-none"
                                    data-testid="week-date"
                                >
                                    {intl.formatMessage({ id: 'header.weekOf', defaultMessage: 'Week of {date}' }, { date: formattedDate })}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="flex items-center gap-1">
                {isHome && (
                        <button
                            onClick={refresh}
                            className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            aria-label={intl.formatMessage({ id: 'action.refresh', defaultMessage: 'Refresh list' })}
                            title={intl.formatMessage({ id: 'action.refresh', defaultMessage: 'Refresh list' })}
                        >
                        <RefreshCw size={18} />
                    </button>
                )}
                
                {/* Burger Menu */}
                <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            aria-label={intl.formatMessage({ id: 'action.openMenu', defaultMessage: 'Open menu' })}
                        >
                        {showMenu ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 py-1 z-50">
                            {isHome && (
                                <button
                                    onClick={() => { resetList(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <PlusCircle size={16} />
                                    <span><FormattedMessage id="header.newWeek" defaultMessage="New Week" /></span>
                                </button>
                            )}
                            <Link
                                href="/settings"
                                onClick={() => setShowMenu(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <Settings size={16} />
                                <span><FormattedMessage id="header.settings" defaultMessage="Settings" /></span>
                            </Link>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                                <LogOut size={16} />
                                <span><FormattedMessage id="header.logout" defaultMessage="Logout" /></span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
