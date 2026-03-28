"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
                        <Image
                            src="/icons/icon.svg"
                            alt="Weekly Shopping List"
                            width={40}
                            height={40}
                            className="object-cover object-center"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        <FormattedMessage id="login.title" defaultMessage="Weekly Shopping List" />
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        <FormattedMessage id="login.subtitle" defaultMessage="Sign in to manage your shopping lists" />
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 ring-1 ring-gray-100 dark:ring-gray-800 p-6">
                    {error && (
                        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg">
                            {error === 'auth_failed' && <FormattedMessage id="error.authFailed" defaultMessage="Authentication was cancelled or failed." />}
                            {error === 'no_email' && <FormattedMessage id="error.noEmail" defaultMessage="Could not get email from Google." />}
                            {error === 'callback_failed' && <FormattedMessage id="error.callbackFailed" defaultMessage="Something went wrong. Please try again." />}
                        </div>
                    )}

                    <a
                        href="/api/auth/google"
                        id="google-sign-in"
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <FormattedMessage id="action.signInWithGoogle" defaultMessage="Sign in with Google" />
                    </a>
                </div>

                <p className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500">
                    <FormattedMessage id="login.securityInfo" defaultMessage="Your data is stored securely and shared only with your chosen collaborators." />
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-400"><FormattedMessage id="app.loading" defaultMessage="Loading..." /></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
