"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "calc(100dvh - 80px)",
        maxWidth: 1400,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <AdminSidebar />
      <main
        style={{
          flex: 1,
          padding: "32px 40px",
          overflow: "auto",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
