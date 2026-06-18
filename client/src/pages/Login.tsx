import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap, Eye, EyeOff, Lock, Mail, AlertCircle,
  User, CheckCircle, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type Mode = "signin" | "signup";

async function apiPost(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

const FIREBASE_READY = isFirebaseConfigured();

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-600 dark:text-red-400 font-medium">{msg}</p>
    </div>
  );
}

export default function Login() {
  const [, navigate]   = useLocation();
  const queryClient    = useQueryClient();
  const { toast }      = useToast();

  const [mode, setMode]               = useState<Mode>("signin");
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [showPw, setShowPw]           = useState(false);
  const [showCpw, setShowCpw]         = useState(false);
  const [error, setError]             = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSuccess = (user: any) => {
    queryClient.setQueryData(["/api/auth/me"], user);
    navigate("/");
  };

  const signinMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/login", { email: email.trim(), password }),
    onSuccess,
    onError: (err: Error) => setError(err.message),
  });

  const signupMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/signup", { fullName: fullName.trim(), email: email.trim(), password }),
    onSuccess: (user) => {
      toast({ title: "Account created!", description: `Welcome to EventElite, ${user.fullName.split(" ")[0]}!` });
      onSuccess(user);
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending = signinMutation.isPending || signupMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "signup") {
      if (!fullName.trim()) return setError("Full name is required");
      if (password.length < 8) return setError("Password must be at least 8 characters");
      if (password !== confirmPassword) return setError("Passwords do not match");
      signupMutation.mutate();
    } else {
      signinMutation.mutate();
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setPassword("");
    setConfirm("");
  };

  const handleGoogle = async () => {
    if (!FIREBASE_READY) {
      setError("Google Sign-In is not configured. Please add Firebase credentials.");
      return;
    }
    setError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(firebaseAuth!, provider);
      const idToken  = await result.user.getIdToken();
      const user     = await apiPost("/api/auth/firebase", { idToken });
      toast({ title: "Signed in with Google!", description: `Welcome, ${user.fullName.split(" ")[0]}!` });
      onSuccess(user);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
      {/* ── Left branding pane ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-[#111318] overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Zap className="w-4.5 h-4.5 text-white" fill="currentColor" />
            </div>
            <div>
              <p className="font-bold text-[17px] text-white leading-none tracking-tight">EventElite</p>
              <p className="text-[10px] text-white/30 font-medium mt-0.5">Agency Management</p>
            </div>
          </div>

          <div className="mt-auto pb-8">
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
              Manage every event<br />
              <span className="text-indigo-400">with confidence.</span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Your complete agency dashboard — clients, vendors, venues, budgets, and analytics in one place.
            </p>
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

      {/* ── Right auth pane ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <p className="font-bold text-[17px] text-slate-900 dark:text-white">EventElite</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              {mode === "signin" ? "Sign in to your agency dashboard" : "Start managing your events today"}
            </p>
          </div>

          {/* Sign In / Sign Up toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5 gap-1">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                data-testid={`tab-${m}`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Google sign-in */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || !FIREBASE_READY}
              className="w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-google"
              title={!FIREBASE_READY ? "Firebase credentials not configured yet" : undefined}
            >
              {googleLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <GoogleIcon />}
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    autoComplete="name"
                    data-testid="input-fullname"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  autoComplete="email"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  data-testid="input-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "signup" && <p className="text-[11px] text-slate-400 mt-1">Minimum 8 characters</p>}
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    type={showCpw ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    autoComplete="new-password"
                    data-testid="input-confirm-password"
                  />
                  <button type="button" onClick={() => setShowCpw(!showCpw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password && (
                  <div className="flex items-center gap-1 mt-1">
                    {password === confirmPassword
                      ? <><CheckCircle className="w-3 h-3 text-emerald-500" /><p className="text-[11px] text-emerald-500">Passwords match</p></>
                      : <><AlertCircle className="w-3 h-3 text-amber-500" /><p className="text-[11px] text-amber-500">Passwords do not match</p></>}
                  </div>
                )}
              </div>
            )}

            {error && <ErrorBox msg={error} />}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 mt-2 transition-all duration-200"
              data-testid="button-submit"
            >
              {isPending
                ? (mode === "signin" ? "Signing in…" : "Creating account…")
                : (mode === "signin" ? "Sign in" : "Create account")}
            </Button>
          </form>

          {/* Footer mode switch */}
          <p className="text-center text-xs text-slate-400 mt-6">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button type="button"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
