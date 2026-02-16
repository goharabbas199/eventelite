import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Store, MapPin, PieChart, LogOut, Settings } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendors", label: "Vendors", icon: Store },
    { href: "/venues", label: "Venues", icon: MapPin },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/budget", label: "Budget Planner", icon: PieChart },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[hsl(222,47%,11%)] text-white z-50 flex flex-col shadow-2xl">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 font-bold text-lg">E</div>
        <span className="font-bold text-xl tracking-tight">EventElite</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
          
          return (
            <Link key={link.href} href={link.href}>
              <div 
                className={`
                  flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center w-full px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </button>
        <button className="flex items-center w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5 mt-1">
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
