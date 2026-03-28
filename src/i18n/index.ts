import en from './messages/en.json';
import es from './messages/es.json';
import ca from './messages/ca.json';

export const messages: Record<string, Record<string, string>> = {
    en: en as Record<string, string>,
    es: es as Record<string, string>,
    ca: ca as Record<string, string>
};

export const defaultLocale = 'en';

export type Locale = 'en' | 'es' | 'ca';
