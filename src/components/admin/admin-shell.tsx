"use client";

import AdminSidebar from "@/components/admin/sidebar";
import type { ReactNode } from "react";

export default function AdminShell({ children }: { children: ReactNode }) {
  const sidebarWidth = 256;

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* Sidebar (left) */}
      <div
        className="fixed left-0 top-0 h-screen"
        style={{ width: sidebarWidth }}
      >
        <AdminSidebar isOpen />
      </div>

      {/* Main content (center) */}
      <main
        className="min-h-screen"
        style={{
          marginLeft: sidebarWidth,
        }}
      >
        <div className="p-4 ">{children}</div>
      </main>
    </div>
  );
}
