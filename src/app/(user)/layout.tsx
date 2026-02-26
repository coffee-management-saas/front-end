import type { ReactNode } from "react";
import ChatbotWidget from "@/components/ChatbotWidget";
import { FloatingCartButton } from "@/components/floating-cart-button";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ChatbotWidget />
      <FloatingCartButton />
    </>
  );
}

