import { Search, Bell, PanelLeft, X, Sun, Moon, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useSettings, applyTheme } from "@/context/SettingsContext";

export function Header({
  title,
  collapsed,
  setCollapsed,
}: {
  title: string;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [, navigate] = useLocation();
  const { profile, appearance, updateAppearance } = useSettings();
  const searchRef = useRef<HTMLInputElement>(null);

  const isDark =
    appearance.theme === "dark" ||
    (appearance.theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setSearch("");
      setMobileSearchOpen(false);
    }
  };

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    updateAppearance({ ...appearance, theme: next });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          searchRef.current?.focus();
        } else {
          setMobileSearchOpen(true);
        }
      }
      if (e.key === "Escape") {
        setMobileSearchOpen(false);
        searchRef.current?.blur();
        setSearch("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => {
        document.getElementById("mobile-search-input")?.focus();
      }, 50);
    }
  }, [mobileSearchOpen]);

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-5 sticky top-0 z-40">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            data-testid="button-toggle-sidebar"
            title="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
        </div>

        {/* CENTER — desktop search */}
        <div className="hidden md:flex flex-1 max-w-[280px] mx-5">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9 pr-16 h-8 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-[13px]"
              data-testid="input-desktop-search"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-500 rounded-md border border-slate-200 dark:border-slate-600 pointer-events-none select-none">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-0.5">
          {/* Mobile search toggle */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            data-testid="button-mobile-search"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:rotate-12"
            data-testid="button-toggle-theme"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark
              ? <Sun className="h-4 w-4 transition-transform duration-200" />
              : <Moon className="h-4 w-4 transition-transform duration-200" />}
          </button>

          {/* Notification bell */}
          <button
            className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            data-testid="button-notifications"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Profile */}
          <div className="flex items-center gap-2 pl-2 ml-1.5 border-l border-slate-100 dark:border-slate-800">
            <div className="hidden md:block text-right">
              <p className="text-[12px] font-semibold leading-none text-slate-800 dark:text-slate-200">{profile.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{profile.role}</p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              title="Go to settings"
              data-testid="button-profile-avatar"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            >
              <Avatar className="h-7 w-7 ring-2 ring-indigo-100 hover:ring-indigo-300 transition-all">
                <AvatarImage src={profile.avatarUrl} />
                <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </div>
        </div>
      </header>

      {mobileSearchOpen && (
        <div className="md:hidden sticky top-14 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              id="mobile-search-input"
              autoFocus
              type="search"
              placeholder="Search clients, vendors, venues…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full"
              data-testid="input-mobile-search"
            />
          </div>
        </div>
      )}
    </>
  );
}
