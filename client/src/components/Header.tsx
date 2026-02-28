import { Search, Bell, PanelLeft } from "lucide-react";
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
  const [, navigate] = useLocation();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setSearch("");
    }
  };

  return (
    <header className="h-16 bg-[hsl(222,47%,11%)] text-white flex items-center justify-between px-6 md:px-8 sticky top-0 z-40 shadow-sm">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-all duration-200"
        >
          <PanelLeft className="w-5 h-5 text-white/80" />
        </button>

        <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white">
          {title}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center space-x-4">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
          <Input
            type="search"
            placeholder="Search vendors, clients, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            className="pl-9 h-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/20 transition-all rounded-full"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/70 hover:text-white rounded-full hover:bg-white/10"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-[hsl(222,47%,11%)]"></span>
        </Button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-none text-white">
              Alex Morgan
            </p>
            <p className="text-xs text-white/60 mt-1">Admin</p>
          </div>

          <Avatar className="h-9 w-9 border border-white/20 shadow-sm cursor-pointer hover:ring-2 hover:ring-white/20 transition-all">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
