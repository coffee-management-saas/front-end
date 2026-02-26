"use client";

import PhucLongHeader from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/footer";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // ẩn header/footer với các route
  const hideShell =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/system") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/forbidden") ||
    pathname === "/login" ||
    pathname === "/system/login" ||
    pathname === "/system/register" ||
    pathname === "/register" ||
    pathname === "/verification";

  if (!mounted) {
    return (
      <div className={!hideShell ? "pt-16" : ""}>
        {!hideShell && <PhucLongHeader />}
        {children}
        {!hideShell && <Footer />}
      </div>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {!hideShell && <PhucLongHeader />}
      <div className={!hideShell ? "pt-16" : ""}>{children}</div>
      {!hideShell && <Footer />}
    </ThemeProvider>
  );
}
