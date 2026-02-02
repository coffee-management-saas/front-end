// app/staff/layout.tsx

import { AdminLayout } from "@/components/admin/AdminLayout";
import type { ReactNode } from "react";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
