"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import StaffShell from "@/components/staff/staff-shell";

export default function StaffLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/staff/payos-callback") {
    return <>{children}</>;
  }

  return <StaffShell>{children}</StaffShell>;
}
