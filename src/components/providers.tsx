"use client";

import { Suspense } from "react";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ShoppingListProvider } from "@/lib/hooks/use-shopping-list";
import { AuthProvider } from "@/components/auth-provider";

import { IntlWrapper } from "./intl-wrapper";
import { FormattedMessage } from "react-intl";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <AuthProvider>
          <IntlWrapper>
            <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500"><FormattedMessage id="app.loading" defaultMessage="Loading..." /></div>}>
              <ShoppingListProvider>
                {children}
              </ShoppingListProvider>
            </Suspense>
          </IntlWrapper>
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
