import { Search, Bell, PanelLeft, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";

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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setSearch("");
      setMobileSearchOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-border/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150"
          title="Toggle sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-none">
            {title}
          </h1>
        </div>
      </div>

      {/* CENTER — desktop search */}
      <div className="hidden md:flex flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="search"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-9 h-9 bg-slate-50 border-border/60 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-xl text-sm"
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile search toggle */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
        >
          {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg w-8 h-8"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-500 rounded-full" />
        </Button>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border/60">
          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold leading-none text-slate-800">Alex Morgan</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Administrator</p>
          </div>
          <Avatar className="h-8 w-8 ring-2 ring-indigo-500/20 cursor-pointer hover:ring-indigo-500/40 transition-all">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">AM</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Mobile search bar (expands below header) */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-border/60 px-4 py-3 shadow-md md:hidden z-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              autoFocus
              type="search"
              placeholder="Search vendors, clients, venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9 h-10 bg-slate-50 border-border/60 rounded-xl text-sm w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
}
