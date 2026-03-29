"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { FormattedMessage } from "react-intl";

interface User {
    name: string;
    email: string;
    picture?: string;
}

interface AccountSectionProps {
    user: User;
    onLogout: () => void;
}

export function AccountSection({ user, onLogout }: AccountSectionProps) {
    return (
        <section>
            <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
                <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        <FormattedMessage id="settings.account" defaultMessage="Account" />
                    </h2>
                </CardHeader>
                <CardBody className="px-6 py-6">
                    <div className="flex items-center gap-4 mb-4">
                        {user.picture ? (
                            <Image src={user.picture} alt="" width={48} height={48} className="rounded-full" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-lg font-medium">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        id="logout-btn"
                    >
                        <LogOut size={16} />
                        <FormattedMessage id="action.signOut" defaultMessage="Sign Out" />
                    </button>
                </CardBody>
            </Card>
        </section>
    );
}
