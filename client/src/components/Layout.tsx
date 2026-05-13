import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
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
  const [location] = useLocation();

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

  // ── Entrance reveal via IntersectionObserver ──
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const timeout = setTimeout(() => {
      const elements = document.querySelectorAll<HTMLElement>(".reveal:not(.visible)");
      if (!elements.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.07, rootMargin: "0px 0px -16px 0px" }
      );

      elements.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 60);

    return () => clearTimeout(timeout);
  }, [location]);

  // ── 3D tilt via event delegation on [data-tilt] ──
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let activeTilt: HTMLElement | null = null;

    const onMouseMove = (e: MouseEvent) => {
      const tiltEl = (e.target as Element).closest<HTMLElement>("[data-tilt]");

      if (activeTilt && activeTilt !== tiltEl) {
        activeTilt.style.transform = "";
        activeTilt.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        activeTilt.classList.remove("tilting");
        activeTilt = null;
      }

      if (!tiltEl) return;

      activeTilt = tiltEl;
      activeTilt.classList.add("tilting");

      const rect = tiltEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const maxDeg = Number(tiltEl.dataset.tiltMax ?? 6);

      const rotX = ((y - cy) / cy) * -maxDeg;
      const rotY = ((x - cx) / cx) * maxDeg;

      tiltEl.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(6px)`;
      tiltEl.style.transition = "transform 0.08s ease";
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return;
      const tiltEl = e.target.closest<HTMLElement>("[data-tilt]");
      if (!tiltEl) return;
      tiltEl.style.transform = "";
      tiltEl.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
      tiltEl.classList.remove("tilting");
      activeTilt = null;
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, true);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave, true);
    };
  }, []);

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
