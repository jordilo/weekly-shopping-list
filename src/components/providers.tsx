"use client";

import { Suspense } from "react";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ShoppingListProvider } from "@/lib/hooks/use-shopping-list";
import { AuthProvider } from "@/components/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <AuthProvider>
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>}>
            <ShoppingListProvider>
              {children}
            </ShoppingListProvider>
          </Suspense>
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
