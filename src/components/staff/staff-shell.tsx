"use client";

import Sidebar from "@/components/staff/sidebar";
import StaffHeader from "@/components/staff/staff-header";
import type { ReactNode } from "react";

export default function StaffShell({ children }: { children: ReactNode }) {
  const sidebarWidth = 256;
  const headerHeight = 72;

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      {/* Sidebar (left) */}
      <div
        className="fixed left-0 top-0 h-screen"
        style={{ width: sidebarWidth }}
      >
        <Sidebar isOpen />
      </div>

      {/* Header (top) */}
      <div
        className="fixed top-0 right-0 z-40"
        style={{
          left: sidebarWidth,
          height: headerHeight,
        }}
      >
        <StaffHeader />
      </div>

      {/* Main content (center) */}
      <main
        className="min-h-screen"
        style={{
          marginLeft: sidebarWidth,
          paddingTop: headerHeight,
        }}
      >
        <div>{children}</div>
      </main>
    </div>
  );
}
