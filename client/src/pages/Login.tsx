import { useState } from "react";
import { useLocation } from "wouter";
import { Zap, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEMO_EMAIL    = "admin@eventelite.com";
const DEMO_PASSWORD = "Admin123!";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("ee_auth", "1");
      navigate("/");
    } else {
      setError("Invalid email or password. Use the demo credentials below.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
      {/* Left pane — branding */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-[#111318] overflow-hidden">
        {/* Gradient blob */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Zap className="w-4.5 h-4.5 text-white" fill="currentColor" />
            </div>
            <div>
              <p className="font-bold text-[17px] text-white leading-none tracking-tight">EventElite</p>
              <p className="text-[10px] text-white/30 font-medium mt-0.5">Agency Management</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="mt-auto pb-8">
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
              Manage every event<br />
              <span className="text-indigo-400">with confidence.</span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Your complete agency dashboard — clients, vendors, venues, budgets, and analytics in one place.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {["Client Tracking", "Budget Planner", "Vendor Management", "Analytics", "Quotations"].map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/60 text-[11px] font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right pane — login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <p className="font-bold text-[17px] text-slate-900 dark:text-white">EventElite</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1.5">Sign in to your agency dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="admin@eventelite.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  autoComplete="email"
                  data-testid="input-email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  autoComplete="current-password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 mt-2"
              data-testid="button-login"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Demo Credentials</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Email</span>
                <code className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{DEMO_EMAIL}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Password</span>
                <code className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{DEMO_PASSWORD}</code>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); }}
              className="mt-3 w-full text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Fill demo credentials →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
