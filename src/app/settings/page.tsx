"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, RadioGroup, Radio } from "@heroui/react";
import { Moon, Sun, Monitor } from "lucide-react";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder that matches the final output to avoid hydration mismatch
    return null;
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your app preferences.</p>
      </header>

      <section>
        <Card className="bg-white dark:bg-[#18181b] shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-none">
          <CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize how Weekly Shopping List looks on your device.</p>
          </CardHeader>
          <CardBody className="px-6 py-6">
            <RadioGroup
              label="Theme Mode"
              orientation="vertical"
              value={theme}
              onValueChange={setTheme}
              className="mt-2"
              classNames={{
                wrapper: "gap-4",
              }}
            >
              <Radio value="system" description="Default to system appearance">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-gray-500" />
                  <span>System</span>
                </div>
              </Radio>
              <Radio value="light" description="Always use light theme">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-orange-400" />
                  <span>Light</span>
                </div>
              </Radio>
              <Radio value="dark" description="Always use dark theme">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span>Dark</span>
                </div>
              </Radio>
            </RadioGroup>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
