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
} from "lucide-react";

const links = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/clients",    label: "Clients",    icon: Users },
  { href: "/vendors",    label: "Vendors",    icon: Store },
  { href: "/venues",     label: "Venues",     icon: MapPin },
  { href: "/quotations", label: "Quotes",     icon: ReceiptText },
  { href: "/budget",     label: "Budget",     icon: PieChart },
  { href: "/analytics",  label: "Analytics",  icon: BarChart2 },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [location] = useLocation();

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
        <div className="w-7 h-7 rounded-lg gradient-indigo flex items-center justify-center shadow-lg shadow-indigo-900/40 shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] tracking-tight text-white leading-none">EventElite</p>
            <p className="text-[9px] text-white/30 font-medium mt-0.5 tracking-wide">Agency Dashboard</p>
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
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/30"
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
                ? "bg-indigo-600 text-white"
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

  const mobileLinks = [
    { href: "/",          label: "Home",      icon: LayoutDashboard },
    { href: "/clients",   label: "Clients",   icon: Users },
    { href: "/vendors",   label: "Vendors",   icon: Store },
    { href: "/venues",    label: "Venues",    icon: MapPin },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-1px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-[58px]">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));

          return (
            <Link key={link.href} href={link.href} className="flex-1">
              <div className={`flex flex-col items-center justify-center gap-1 h-full transition-all duration-150 ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                <div className={`p-1 rounded-lg transition-all ${isActive ? "bg-indigo-50" : ""}`}>
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className="text-[9px] font-semibold leading-none tracking-wide">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
