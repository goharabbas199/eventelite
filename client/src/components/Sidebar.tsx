import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Store,
  MapPin,
  PieChart,
  BarChart2,
  Settings,
  Zap,
  ReceiptText,
  CalendarDays,
  Calendar,
  FileText,
  Sparkles,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const links = [
  { href: "/",           label: "Dashboard",    icon: LayoutDashboard },
  { href: "/clients",    label: "Clients",      icon: Users },
  { href: "/events",     label: "Events",       icon: CalendarDays },
  { href: "/calendar",   label: "Calendar",     icon: Calendar },
  { href: "/vendors",    label: "Vendors",      icon: Store },
  { href: "/venues",     label: "Venues",       icon: MapPin },
  { href: "/quotations", label: "Quotes",       icon: ReceiptText },
  { href: "/invoices",   label: "Invoices",     icon: FileText },
  { href: "/budget",     label: "Budget",       icon: PieChart },
  { href: "/analytics",  label: "Analytics",    icon: BarChart2 },
  { href: "/ai",         label: "AI Assistant", icon: Sparkles },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [location] = useLocation();
  const { business } = useSettings();

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-50
        hidden md:flex flex-col
        bg-[#111318] text-white
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[64px]" : "w-56"}
      `}
      style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Brand */}
      <div
        className={`h-14 flex items-center shrink-0 ${collapsed ? "justify-center px-0" : "px-4 gap-2.5"}`}
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-black/30 shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] tracking-tight text-white leading-none">EventElite</p>
            <p className="text-[9px] text-white/30 font-medium mt-0.5 tracking-wide">{business.companyName}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/20 px-3 pb-1.5 pt-1">Menu</p>
        )}
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));

          return (
            <Link key={link.href} href={link.href}>
              <div
                className={`
                  nav-item group
                  ${collapsed ? "justify-center px-0" : ""}
                  ${isActive
                    ? "bg-primary text-white shadow-sm shadow-black/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"}
                `}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && <span>{link.label}</span>}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/settings">
          <div
            className={`
              nav-item
              ${collapsed ? "justify-center px-0" : ""}
              ${location === "/settings"
                ? "bg-primary text-white"
                : "text-white/35 hover:text-white/70 hover:bg-white/[0.05]"}
            `}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
            {!collapsed && <span>Settings</span>}
          </div>
        </Link>
      </div>
    </aside>
  );
}

/* ─── Mobile Bottom Navigation ─── */
export function MobileNav() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryLinks = [
    { href: "/",          label: "Home",     icon: LayoutDashboard },
    { href: "/clients",   label: "Clients",  icon: Users },
    { href: "/events",    label: "Events",   icon: CalendarDays },
    { href: "/invoices",  label: "Invoices", icon: FileText },
  ];

  const moreLinks = [
    { href: "/vendors",    label: "Vendors",      icon: Store },
    { href: "/venues",     label: "Venues",       icon: MapPin },
    { href: "/quotations", label: "Quotes",       icon: ReceiptText },
    { href: "/budget",     label: "Budget",       icon: PieChart },
    { href: "/calendar",   label: "Calendar",     icon: Calendar },
    { href: "/analytics",  label: "Analytics",    icon: BarChart2 },
    { href: "/ai",         label: "AI Assistant", icon: Sparkles },
    { href: "/settings",   label: "Settings",     icon: Settings },
  ];

  const isMoreActive = moreLinks.some(
    (l) => location === l.href || (l.href !== "/" && location.startsWith(l.href))
  );

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-1px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch h-[58px]">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const isActive = !moreOpen && (location === link.href || (link.href !== "/" && location.startsWith(link.href)));
            return (
              <Link key={link.href} href={link.href} className="flex-1" onClick={() => setMoreOpen(false)}>
                <div className={`flex flex-col items-center justify-center gap-1 h-full transition-all duration-150 ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"}`}>
                  <div className={`p-1 rounded-lg transition-all ${isActive ? "bg-primary/10" : ""}`}>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>
                  <span className="text-[9px] font-semibold leading-none tracking-wide">{link.label}</span>
                </div>
              </Link>
            );
          })}

          {/* More button */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-150"
            onClick={() => setMoreOpen((o) => !o)}
            data-testid="button-mobile-more"
          >
            <div className={`p-1 rounded-lg transition-all ${moreOpen || isMoreActive ? "bg-primary/10" : ""}`}>
              {moreOpen
                ? <X className="w-[18px] h-[18px]" strokeWidth={2.2} style={{ color: "hsl(var(--primary))" }} />
                : <MoreHorizontal className={`w-[18px] h-[18px]`} strokeWidth={moreOpen || isMoreActive ? 2.2 : 1.8} style={{ color: moreOpen || isMoreActive ? "hsl(var(--primary))" : undefined }} />
              }
            </div>
            <span className={`text-[9px] font-semibold leading-none tracking-wide ${moreOpen || isMoreActive ? "text-primary" : "text-slate-400 dark:text-slate-500"}`}>More</span>
          </button>
        </div>
      </nav>

      {/* More Menu — slide-up overlay */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div className="md:hidden fixed bottom-[58px] left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-t-2xl shadow-2xl px-4 pt-3 pb-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">More pages</p>
            <div className="grid grid-cols-4 gap-2">
              {moreLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    data-testid={`mobile-more-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}>
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                      <span className="text-[10px] font-semibold text-center leading-tight">{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
