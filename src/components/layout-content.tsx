"use client";

import PhucLongHeader from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  const hideHeader =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verification";

  if (!mounted) {
    return (
      <div className={!hideHeader ? "pt-16" : ""}>
        {!hideHeader && <PhucLongHeader />}
        {children}
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
      {!hideHeader && <PhucLongHeader />}
      <div className={!hideHeader ? "pt-16" : ""}>{children}</div>
    </ThemeProvider>
  );
}
