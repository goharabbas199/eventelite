import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f6fa]">
      <div className="flex flex-col items-center text-center px-6 max-w-sm">
        {/* Big number */}
        <div className="text-[120px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-indigo-300 select-none">
          404
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-2">Page not found</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <Link href="/">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-all shadow-sm shadow-indigo-900/20">
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
