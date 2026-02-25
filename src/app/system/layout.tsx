// app/staff/layout.tsx

import { SystemLayout } from "@/components/system/SystemLayout";
import type { ReactNode } from "react";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return <SystemLayout>{children}</SystemLayout>;
}
