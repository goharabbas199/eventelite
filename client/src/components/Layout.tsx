import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
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
    <div className="min-h-screen bg-slate-50/50">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Content Wrapper */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "md:pl-16" : "md:pl-64"
        }`}
      >
        {/* Header */}
        <Header
          title={title}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* Main Content */}
        <main className="flex-1 px-6 md:px-8 pb-8 pt-6 space-y-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
