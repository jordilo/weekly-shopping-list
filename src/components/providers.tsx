"use client";

import { HeroUIProvider } from "@heroui/react";
import { ShoppingListProvider } from "@/lib/hooks/use-shopping-list";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ShoppingListProvider>
        {children}
      </ShoppingListProvider>
    </HeroUIProvider>
  );
}
