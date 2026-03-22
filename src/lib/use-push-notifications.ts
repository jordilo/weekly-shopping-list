"use client";

import { useEffect, useState, useCallback } from 'react';

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

export function usePushNotifications() {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isUnsubscribing, setIsUnsubscribing] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    const checkSubscription = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }, []);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const standalone = 'standalone' in window.navigator ? Boolean(window.navigator.standalone) : window.matchMedia('(display-mode: standalone)').matches;

        setIsIOS(ios);
        setIsStandalone(standalone);

        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }

        checkSubscription();
    }, [checkSubscription]);

    const subscribe = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
            const standalone = 'standalone' in window.navigator ? (window.navigator as unknown as { standalone: boolean }).standalone : window.matchMedia('(display-mode: standalone)').matches;
            
            if (ios && !standalone) {
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

            setIsSubscribed(true);

            // Trigger a test notification
            registration.showNotification('Notifications Enabled!', {
                body: 'You will now receive alerts for new items.',
                icon: '/icons/icon-192x192.png'
            });

        } catch (error) {
            console.error('Subscription error:', error);
            alert('Failed to enable notifications. Please try again.');
        } finally {
            setIsSubscribing(false);
        }
    };

    const unsubscribe = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        setIsUnsubscribing(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Remove from server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });

                // Unsubscribe from push manager
                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
        } catch (error) {
            console.error('Unsubscription error:', error);
            alert('Failed to disable notifications properly, but we removed them from this device.');
            // Still set to false to reflect UI state
            setIsSubscribed(false);
        } finally {
            setIsUnsubscribing(false);
        }
    };

    return {
        permissionStatus,
        isSubscribed,
        isSubscribing,
        isUnsubscribing,
        isIOS,
        isStandalone,
        subscribe,
        unsubscribe,
        setPermissionStatus
    };
}
