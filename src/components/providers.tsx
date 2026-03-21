"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ShoppingListProvider } from "@/lib/hooks/use-shopping-list";
import { AuthProvider } from "@/components/auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <AuthProvider>
          <ShoppingListProvider>
            {children}
          </ShoppingListProvider>
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
