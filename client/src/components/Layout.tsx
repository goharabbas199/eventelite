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
    <div className="min-h-screen bg-[#f4f5f8] dark:bg-slate-950">
      <Sidebar collapsed={collapsed} />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "md:pl-[64px]" : "md:pl-56"
        }`}
      >
        <Header title={title} collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className="flex-1 px-4 md:px-6 py-5 pb-24 md:pb-6 space-y-5">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
