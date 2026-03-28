"use client";

import { Card, CardBody, CardHeader, RadioGroup, Radio } from "@heroui/react";
import { Monitor, Sun, Moon } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

interface AppearanceSectionProps {
    theme: string | undefined;
    setTheme: (theme: string) => void;
}

export function AppearanceSection({ theme, setTheme }: AppearanceSectionProps) {
    const intl = useIntl();

    return (
        <section>
            <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
                <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        <FormattedMessage id="settings.appearance" defaultMessage="Appearance" />
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        <FormattedMessage id="settings.appearanceDesc" defaultMessage="Customize how Weekly Shopping List looks on your device." />
                    </p>
                </CardHeader>
                <CardBody className="px-6 py-6">
                    <RadioGroup
                        label={intl.formatMessage({ id: 'settings.themeMode', defaultMessage: 'Theme Mode' })}
                        orientation="vertical"
                        value={theme}
                        onValueChange={setTheme}
                        className="mt-2"
                        classNames={{
                            wrapper: "gap-4",
                        }}
                    >
                        <Radio 
                            value="system" 
                            description={intl.formatMessage({ id: 'settings.themeSystemDesc', defaultMessage: 'Default to system appearance' })}
                        >
                            <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-gray-500" />
                                <span><FormattedMessage id="settings.themeSystem" defaultMessage="System" /></span>
                            </div>
                        </Radio>
                        <Radio 
                            value="light" 
                            description={intl.formatMessage({ id: 'settings.themeLightDesc', defaultMessage: 'Always use light theme' })}
                        >
                            <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-orange-400" />
                                <span><FormattedMessage id="settings.themeLight" defaultMessage="Light" /></span>
                            </div>
                        </Radio>
                        <Radio 
                            value="dark" 
                            description={intl.formatMessage({ id: 'settings.themeDarkDesc', defaultMessage: 'Always use dark theme' })}
                        >
                            <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-blue-400" />
                                <span><FormattedMessage id="settings.themeDark" defaultMessage="Dark" /></span>
                            </div>
                        </Radio>
                    </RadioGroup>
                </CardBody>
            </Card>
        </section>
    );
}
