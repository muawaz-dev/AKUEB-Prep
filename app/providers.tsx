"use client";

import { ThemeProvider } from "next-themes";
import { MathScrollHint } from "@/components/MathScrollHint";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MathScrollHint />
      {children}
    </ThemeProvider>
  );
}
