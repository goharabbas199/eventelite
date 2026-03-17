import { useState, useEffect } from "react";
import { Sidebar, MobileNav } from "./Sidebar";
import { Header } from "./Header";
import { useSettings } from "@/context/SettingsContext";

export function Layout({
  children,
  title = "Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { appearance, isLoaded } = useSettings();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (isLoaded) {
      setCollapsed(appearance.sidebarCollapsed);
    }
  }, [isLoaded]);

  useEffect(() => {
    const root = document.documentElement;
    if (appearance.animationsEnabled) {
      root.classList.remove("no-animations");
    } else {
      root.classList.add("no-animations");
    }
  }, [appearance.animationsEnabled]);

  return (
    <div className="min-h-screen bg-[#f4f5f8] dark:bg-slate-950">
      <Sidebar collapsed={collapsed} />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "md:pl-[64px]" : "md:pl-56"
        }`}
      >
        <Header title={title} collapsed={collapsed} setCollapsed={setCollapsed} />

        <main className="flex-1 px-3 md:px-6 py-4 md:py-5 pb-24 md:pb-6 space-y-4 md:space-y-5">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
