"use client";

import PhucLongHeader from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FloatingCartButton } from "@/components/floating-cart-button";

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
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verification";

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

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
      {!hideShell && <ChatbotWidget />}
      {!hideShell && <FloatingCartButton />}
    </ThemeProvider>
  );
}
