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
        bg-zinc-950 text-white
        border-r border-zinc-800/60
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[64px]" : "w-56"}
      `}
    >
      {/* Brand */}
      <div
        className={`h-14 flex items-center shrink-0 border-b border-zinc-800/60 ${
          collapsed ? "justify-center px-0" : "px-4 gap-2.5"
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] tracking-tight text-white leading-none">EventElite</p>
            <p className="text-[9px] text-zinc-500 font-medium mt-0.5 tracking-wide truncate">
              {business.companyName || "Agency Dashboard"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600 px-3 pb-2 pt-1">
            Menu
          </p>
        )}
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            location === link.href ||
            (link.href !== "/" && location.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              data-testid={`link-sidebar-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div
                className={`
                  nav-item group transition-all duration-150
                  ${collapsed ? "justify-center px-0" : ""}
                  ${
                    isActive
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                  }
                `}
                title={collapsed ? link.label : undefined}
              >
                <Icon
                  className="w-[17px] h-[17px] shrink-0 transition-colors duration-150"
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {!collapsed && (
                  <span className="transition-colors duration-150">{link.label}</span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-500/50" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-zinc-800/60">
        <Link href="/settings" data-testid="link-sidebar-settings">
          <div
            className={`
              nav-item
              ${collapsed ? "justify-center px-0" : ""}
              ${
                location === "/settings"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900"
              }
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
    { href: "/",         label: "Home",     icon: LayoutDashboard },
    { href: "/clients",  label: "Clients",  icon: Users },
    { href: "/events",   label: "Events",   icon: CalendarDays },
    { href: "/invoices", label: "Invoices", icon: FileText },
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-1px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-[58px]">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              !moreOpen &&
              (location === link.href ||
                (link.href !== "/" && location.startsWith(link.href)));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex-1"
                onClick={() => setMoreOpen(false)}
                data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-all duration-150 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  <div
                    className={`p-1 rounded-lg transition-all ${
                      isActive ? "bg-indigo-50 dark:bg-indigo-950/60" : ""
                    }`}
                  >
                    <Icon
                      className="w-[18px] h-[18px]"
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </div>
                  <span className="text-[9px] font-semibold leading-none tracking-wide">
                    {link.label}
                  </span>
                </div>
              </Link>
            );
          })}

          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-150"
            onClick={() => setMoreOpen((o) => !o)}
            data-testid="button-mobile-more"
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                moreOpen || isMoreActive ? "bg-indigo-50 dark:bg-indigo-950/60" : ""
              }`}
            >
              {moreOpen ? (
                <X
                  className="w-[18px] h-[18px] text-indigo-600 dark:text-indigo-400"
                  strokeWidth={2.2}
                />
              ) : (
                <MoreHorizontal
                  className={`w-[18px] h-[18px] ${
                    moreOpen || isMoreActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                  strokeWidth={moreOpen || isMoreActive ? 2.2 : 1.8}
                />
              )}
            </div>
            <span
              className={`text-[9px] font-semibold leading-none tracking-wide ${
                moreOpen || isMoreActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-400 dark:text-zinc-600"
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div className="md:hidden fixed bottom-[58px] left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-t-2xl shadow-2xl px-4 pt-3 pb-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="w-10 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-auto mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3 px-1">
              More pages
            </p>
            <div className="grid grid-cols-4 gap-2">
              {moreLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  location === link.href ||
                  (link.href !== "/" && location.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    data-testid={`mobile-more-link-${link.label
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    <div
                      className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                      <span className="text-[10px] font-semibold text-center leading-tight">
                        {link.label}
                      </span>
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
