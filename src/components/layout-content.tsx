"use client";

import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { usePathname } from "next/navigation";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideHeader = pathname === "/login" || pathname === "/register";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {!hideHeader && <Header />}
      <div className={!hideHeader ? "pt-16" : ""}>{children}</div>
    </ThemeProvider>
  );
}
