import { Search, Bell, PanelLeft, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
    if (e.key === "Enter" && search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setSearch("");
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-5 sticky top-0 z-40">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[15px] font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>

        {/* CENTER — desktop search */}
        <div className="hidden md:flex flex-1 max-w-[280px] mx-5">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9 h-8 bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-[13px]"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-0.5">
          {/* Mobile search */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
          >
            {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Bell */}
          <button className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-indigo-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Divider + User */}
          <div className="flex items-center gap-2 pl-2 ml-1.5 border-l border-slate-100">
            <div className="hidden md:block text-right">
              <p className="text-[12px] font-semibold leading-none text-slate-800">Alex Morgan</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Administrator</p>
            </div>
            <Avatar className="h-7 w-7 ring-2 ring-indigo-100 cursor-pointer hover:ring-indigo-300 transition-all">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">AM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Mobile search dropdown */}
      {mobileSearchOpen && (
        <div className="md:hidden sticky top-14 z-40 bg-white border-b border-slate-100 px-4 py-2.5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              type="search"
              placeholder="Search clients, vendors, venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-xl text-sm w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
