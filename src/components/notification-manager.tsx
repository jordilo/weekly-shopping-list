"use client";

import { useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function NotificationManager() {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const standalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

        setIsIOS(ios);
        setIsStandalone(standalone);

        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('SW Registered:', reg.scope);
                })
                .catch(err => console.error('SW Registration Error:', err));
        }
    }, []);

    const requestPermissionAndSubscribe = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            if (isIOS && !isStandalone) {
                alert('On iPhone, you must first "Add to Home Screen" to enable notifications.');
            } else {
                alert('Push notifications are not supported in this browser.');
            }
            return;
        }

        setIsSubscribing(true);
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission !== 'granted') return;

            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!)
            });

            // Send subscription to server
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });

            if (!res.ok) throw new Error('Failed to save subscription on server');

            // Trigger a test notification
            registration.showNotification('Notifications Enabled!', {
                body: 'You will now receive alerts for new items.',
                icon: '/icons/icon-192x192.png'
            });

        } catch (error) {
            console.error('Subscription error:', error);
        } finally {
            setIsSubscribing(false);
        }
    };

    if (permissionStatus === 'default') {
        const showInstructions = isIOS && !isStandalone;

        return (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-white dark:bg-gray-900 border border-blue-500 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>

                    {showInstructions ? (
                        <>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Setup iPhone Alerts</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    To receive notifications on iPhone, you must add this app to your Home Screen:
                                </p>
                                <ol className="text-left text-xs text-gray-600 dark:text-gray-300 mt-3 space-y-2 list-decimal list-inside">
                                    <li>Tap the <strong>Share</strong> button ( <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100 2.684m0-2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg> or <svg className="inline w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg> )</li>
                                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                                    <li>Open the app from your <strong>Home Screen</strong> to enable alerts</li>
                                </ol>
                            </div>
                            <button
                                onClick={() => setPermissionStatus('denied')}
                                className="w-full text-blue-600 font-medium py-2 text-sm"
                            >
                                Got it
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg uppercase tracking-tight">Enable Alerts</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when someone adds items to the list.</p>
                            </div>
                            <button
                                onClick={requestPermissionAndSubscribe}
                                disabled={isSubscribing}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                {isSubscribing ? 'Subscribing...' : 'Allow Notifications'}
                            </button>
                            <button
                                onClick={() => setPermissionStatus('denied')}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                Maybe later
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
