"use client";

import { useIntl, FormattedMessage } from "react-intl";
import { useAuth } from "@/components/auth-provider";
import { Globe } from "lucide-react";

export function LanguageSection() {
    const { user, updateLanguage } = useAuth();
    const intl = useIntl();

    if (!user) return null;

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateLanguage(e.target.value as 'en' | 'es' | 'ca');
    };

    return (
        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
                <Globe className="w-5 h-5 mr-2 text-indigo-500" />
                <FormattedMessage id="settings.language" defaultMessage="Language" />
            </h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                            <FormattedMessage id="settings.language" defaultMessage="Language" />
                        </p>
                    </div>
                    <select
                        value={user.language || 'en'}
                        onChange={handleLanguageChange}
                        className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="en">{intl.formatMessage({ id: 'language.en', defaultMessage: 'English' })}</option>
                        <option value="es">{intl.formatMessage({ id: 'language.es', defaultMessage: 'Spanish' })}</option>
                        <option value="ca">{intl.formatMessage({ id: 'language.ca', defaultMessage: 'Catalan' })}</option>
                    </select>
                </div>
            </div>
        </section>
    );
}
