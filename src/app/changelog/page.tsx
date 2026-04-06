"use client";

import { PageContainer } from "@/components/page-container";
import { FormattedMessage } from "react-intl";
import changelog from "@/lib/changelog.json";

export default function ChangelogPage() {
    return (
        <PageContainer className="pb-10">
            <header className="mb-8">
                <p className="text-gray-500 dark:text-gray-400">
                    <FormattedMessage id="changelog.title" defaultMessage="Changelog" />
                </p>
            </header>

            <div className="space-y-8">
                {changelog.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">
                        <FormattedMessage id="changelog.empty" defaultMessage="No changes recorded yet." />
                    </p>
                ) : (
                    changelog.map((entry, index) => (
                        <div key={entry.version} className="relative pl-8">
                            {/* Timeline line */}
                            {index !== changelog.length - 1 && (
                                <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
                            )}
                            
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        <FormattedMessage id="changelog.version" defaultMessage="Version {version}" values={{ version: entry.version }} />
                                    </h2>
                                    <time className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {entry.date}
                                    </time>
                                </div>
                                <ul className="space-y-2">
                                    {entry.changes.map((change, i) => (
                                        <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                                            <span className="text-blue-500 dark:text-blue-400 mt-1.5 w-1 h-1 rounded-full flex-shrink-0" />
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </PageContainer>
    );
}
