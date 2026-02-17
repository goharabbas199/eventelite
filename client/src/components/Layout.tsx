import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function Layout({
  children,
  title = "Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />

      <div className="flex flex-col min-h-screen transition-all duration-300 md:pl-64">
        <Header title={title} />

        <main className="flex-1 p-6 md:p-8 space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
          {children}
        </main>
      </div>
    </div>
  );
}
