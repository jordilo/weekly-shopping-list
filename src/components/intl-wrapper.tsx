"use client";

import { IntlProvider } from 'react-intl';
import { useAuth } from './auth-provider';
import { messages, Locale } from '@/i18n';
import { useMemo } from 'react';

export function IntlWrapper({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    const locale = useMemo(() => {
        if (user?.language) {
            return user.language as Locale;
        }
        if (typeof navigator !== 'undefined') {
            const browserLang = navigator.language.split('-')[0];
            if (['en', 'es', 'ca'].includes(browserLang)) {
                return browserLang as Locale;
            }
        }
        return 'en' as Locale;
    }, [user?.language]);

    return (
        <IntlProvider messages={messages[locale]} locale={locale} defaultLocale="en">
            {children}
        </IntlProvider>
    );
}
