import { Search, Bell, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm/50">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      
      <div className="flex items-center space-x-4">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search..." 
            className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-full" 
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-none">Alex Morgan</p>
            <p className="text-xs text-muted-foreground mt-1">Admin</p>
          </div>
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
