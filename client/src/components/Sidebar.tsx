import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Store,
  MapPin,
  PieChart,
  BarChart2,
  Settings,
  Sparkles,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/venues", label: "Venues", icon: MapPin },
  { href: "/budget", label: "Budget", icon: PieChart },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [location] = useLocation();

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 z-50 flex-col
        hidden md:flex
        bg-[#0f1117] text-white
        transition-all duration-300 ease-in-out
        shadow-2xl
        ${collapsed ? "w-[68px]" : "w-60"}
      `}
    >
      {/* Brand */}
      <div className={`h-16 flex items-center shrink-0 border-b border-white/[0.06] ${collapsed ? "justify-center px-0" : "px-4 gap-3"}`}>
        <div className="w-8 h-8 rounded-xl gradient-blue flex items-center justify-center shadow-lg shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-base tracking-tight text-white">EventElite</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-3 mt-1">
            Navigation
          </p>
        )}
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            location === link.href ||
            (link.href !== "/" && location.startsWith(link.href));

          return (
            <Link key={link.href} href={link.href}>
              <div
                className={`
                  nav-item group relative
                  ${collapsed ? "justify-center" : ""}
                  ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                      : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                  }
                `}
                title={collapsed ? link.label : undefined}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-white" : ""}`} />
                {!collapsed && (
                  <span className="text-[13px]">{link.label}</span>
                )}
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-300 rounded-l-full" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/[0.06]">
        <Link href="/settings">
          <div
            className={`
              nav-item
              ${collapsed ? "justify-center" : ""}
              ${location === "/settings"
                ? "bg-indigo-600 text-white"
                : "text-white/40 hover:text-white hover:bg-white/[0.06]"
              }
            `}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="text-[13px]">Settings</span>}
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
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/vendors", label: "Vendors", icon: Store },
    { href: "/venues", label: "Venues", icon: MapPin },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch h-16">
        {mobileLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            location === link.href ||
            (link.href !== "/" && location.startsWith(link.href));

          return (
            <Link key={link.href} href={link.href} className="flex-1">
              <div
                className={`
                  flex flex-col items-center justify-center gap-1 h-full
                  transition-all duration-150
                  ${isActive ? "text-indigo-600" : "text-slate-400"}
                `}
              >
                <div className={`relative p-1 rounded-xl transition-all duration-150 ${isActive ? "bg-indigo-50" : ""}`}>
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                  {link.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
