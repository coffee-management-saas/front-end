// app/staff/layout.tsx
import AdminShell from "@/components/admin/admin-shell";
import type { ReactNode } from "react";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
