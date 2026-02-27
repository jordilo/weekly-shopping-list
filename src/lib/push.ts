import webpush from 'web-push';

let isConfigured = false;

export function configureWebPush() {
    if (isConfigured) return true;

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
    const mailto = process.env.VAPID_MAILTO || 'mailto:example@yourdomain.com';

    if (!publicVapidKey || !privateVapidKey) {
        console.warn('Push Notifications: VAPID keys are missing. Skipping configuration.');
        return false;
    }

    try {
        webpush.setVapidDetails(mailto, publicVapidKey, privateVapidKey);
        isConfigured = true;
        return true;
    } catch (error) {
        console.error('Push Notifications: Failed to set VAPID details:', error);
        return false;
    }
}

export default webpush;
