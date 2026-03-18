"use client";

import PhucLongHeader from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import { usePathname } from "next/navigation";
import { FloatingCartButton } from "@/components/floating-cart-button";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mounted = false;
  // ẩn header/footer với các route
  const hideShell =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/system") ||
    pathname.startsWith("/staff") ||
    pathname === "/login" ||
    pathname === "/checkout/subscription" ||
    pathname === "/subscription/momo-callback" ||
    pathname === "/forgot" ||
    pathname === "/register" ||
    pathname === "/portal" ||
    pathname === "/about-us" ||
    pathname === "/subscription" ||
    pathname === "/support" ||
    pathname === "/verification";

  if (!mounted) {
    return (
      <div>
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
      <div>{children}</div>
      {!hideShell && <Footer />}
      {!hideShell && <ChatbotWidget />}
      {!hideShell && <FloatingCartButton />}
    </ThemeProvider>
  );
}
