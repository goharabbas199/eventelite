import { useState, useEffect } from "react";
import { Sidebar, MobileNav } from "./Sidebar";
import { Header } from "./Header";

export function Layout({
  children,
  title = "Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Main content — shifted right on desktop */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "md:pl-[68px]" : "md:pl-60"
        }`}
      >
        {/* Header */}
        <Header title={title} collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Page Content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-24 md:pb-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  );
}
