import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Zap, Eye, EyeOff, Lock, Mail, AlertCircle, User,
  CheckCircle, ArrowLeft, RefreshCw, ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup" | "verify-email" | "forgot-password" | "reset-password";

async function apiPost(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message || "Something went wrong"), { data });
  return data;
}

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleChange = (i: number, ch: string) => {
    const clean = ch.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    const joined = next.join("").replace(/\s/g, "");
    onChange(joined.slice(0, 6));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        const next = [...digits];
        next[i - 1] = "";
        onChange(next.join("").replace(/\s/g, "").slice(0, 6));
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(text);
    const focusIdx = Math.min(text.length, 5);
    refs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-11 h-13 text-center text-xl font-bold border-2 rounded-xl
            bg-white dark:bg-slate-800 text-slate-900 dark:text-white
            border-slate-200 dark:border-slate-700
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
            disabled:opacity-50 transition-all duration-150"
          style={{ height: "52px" }}
          data-testid={`input-otp-${i}`}
        />
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const startResendCooldown = () => setResendCooldown(60);

  const onAuthSuccess = (user: any) => {
    queryClient.setQueryData(["/api/auth/me"], user);
    navigate("/");
  };

  const goToVerify = (targetEmail: string, responseDevOtp?: string) => {
    setEmail(targetEmail);
    setOtp("");
    setError("");
    if (responseDevOtp) setDevOtp(responseDevOtp);
    startResendCooldown();
    setMode("verify-email");
  };

  const signinMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/login", { email: email.trim(), password }),
    onSuccess: onAuthSuccess,
    onError: (err: any) => {
      if (err?.data?.pendingVerification) {
        goToVerify(email.trim(), err?.data?.devOtp);
      } else {
        setError(err.message);
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/signup", { fullName: fullName.trim(), email: email.trim(), password }),
    onSuccess: (data) => {
      goToVerify(data.email, data.devOtp);
      toast({ title: "Account created!", description: "Check your email for the verification code." });
    },
    onError: (err: Error) => setError(err.message),
  });

  const verifyMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/verify-email", { email, code: otp }),
    onSuccess: (user) => {
      toast({ title: "Email verified!", description: `Welcome to EventElite, ${user.fullName.split(" ")[0]}!` });
      onAuthSuccess(user);
    },
    onError: (err: Error) => setError(err.message),
  });

  const resendMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/resend-otp", { email, type: "email_verify" }),
    onSuccess: (data) => {
      if (data.devOtp) setDevOtp(data.devOtp);
      startResendCooldown();
      setOtp("");
      toast({ title: "Code resent", description: "A new verification code has been sent." });
    },
    onError: (err: Error) => setError(err.message),
  });

  const forgotMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/forgot-password", { email: email.trim() }),
    onSuccess: (data) => {
      if (data.devOtp) setDevOtp(data.devOtp);
      startResendCooldown();
      setOtp("");
      setMode("reset-password");
    },
    onError: (err: Error) => setError(err.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => apiPost("/api/auth/reset-password", { email, code: otp, newPassword }),
    onSuccess: () => {
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      setMode("signin");
      setPassword("");
      setOtp("");
      setDevOtp(null);
      setError("");
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending =
    signinMutation.isPending || signupMutation.isPending ||
    verifyMutation.isPending || resendMutation.isPending ||
    forgotMutation.isPending || resetMutation.isPending;

  const handleSignin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required");
    if (!password) return setError("Password is required");
    signinMutation.mutate();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("Full name is required");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    signupMutation.mutate();
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) return setError("Please enter the 6-digit code");
    verifyMutation.mutate();
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Please enter your email address");
    forgotMutation.mutate();
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) return setError("Please enter the 6-digit code");
    if (newPassword.length < 8) return setError("Password must be at least 8 characters");
    if (newPassword !== confirmNewPassword) return setError("Passwords do not match");
    resetMutation.mutate();
  };

  const switchToMode = (m: Mode) => {
    setMode(m);
    setError("");
    setOtp("");
    setDevOtp(null);
    setPassword("");
    setConfirmPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const brandPanel = (
    <div className="hidden lg:flex lg:w-[52%] relative flex-col bg-[#111318] overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
      <div className="relative z-10 flex flex-col h-full p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
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
  );

  const mobileLogo = (
    <div className="lg:hidden flex items-center gap-2.5 mb-10">
      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
        <Zap className="w-4 h-4 text-white" fill="currentColor" />
      </div>
      <p className="font-bold text-[17px] text-slate-900 dark:text-white">EventElite</p>
    </div>
  );

  const errorBox = error ? (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
    </div>
  ) : null;

  const devOtpBox = devOtp ? (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Dev mode — your code is:</p>
        <p className="text-base font-bold text-amber-800 dark:text-amber-300 tracking-[6px] mt-0.5">{devOtp}</p>
        <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70 mt-1">Configure SMTP env vars to send real emails</p>
      </div>
    </div>
  ) : null;

  /* ── Verify Email ─────────────────────────────────────── */
  if (mode === "verify-email") {
    return (
      <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
        {brandPanel}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          {mobileLogo}
          <div className="w-full max-w-sm">
            <button onClick={() => switchToMode("signup")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-6 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="text-center mb-7">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Check your email</h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                We sent a 6-digit code to<br />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
              </p>
            </div>
            {devOtpBox}
            <form onSubmit={handleVerify} className="space-y-5 mt-4">
              <OtpInput value={otp} onChange={setOtp} disabled={isPending} />
              {errorBox}
              <Button
                type="submit"
                disabled={isPending || otp.length !== 6}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 transition-all duration-200"
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? "Verifying…" : "Verify email"}
              </Button>
            </form>
            <div className="text-center mt-5">
              <p className="text-xs text-slate-400">
                Didn't receive it?{" "}
                {resendCooldown > 0 ? (
                  <span className="text-slate-400">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setError(""); resendMutation.mutate(); }}
                    disabled={resendMutation.isPending}
                    className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors inline-flex items-center gap-1"
                    data-testid="button-resend-otp"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend code
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Forgot Password ──────────────────────────────────── */
  if (mode === "forgot-password") {
    return (
      <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
        {brandPanel}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          {mobileLogo}
          <div className="w-full max-w-sm">
            <button onClick={() => switchToMode("signin")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-6 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </button>
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Forgot password?</h2>
              <p className="text-slate-400 text-sm mt-1.5">Enter your email and we'll send a reset code.</p>
            </div>
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    autoComplete="email"
                    data-testid="input-forgot-email"
                  />
                </div>
              </div>
              {errorBox}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 transition-all duration-200"
                data-testid="button-send-reset"
              >
                {forgotMutation.isPending ? "Sending…" : "Send reset code"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Reset Password ───────────────────────────────────── */
  if (mode === "reset-password") {
    return (
      <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
        {brandPanel}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          {mobileLogo}
          <div className="w-full max-w-sm">
            <button onClick={() => switchToMode("forgot-password")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-6 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="text-center mb-7">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reset password</h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Enter the code sent to<br />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
              </p>
            </div>
            {devOtpBox}
            <form onSubmit={handleReset} className="space-y-4 mt-4">
              <OtpInput value={otp} onChange={setOtp} disabled={isPending} />
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    type={showNewPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    autoComplete="new-password"
                    data-testid="input-new-password"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Confirm new password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    autoComplete="new-password"
                    data-testid="input-confirm-new-password"
                  />
                </div>
                {confirmNewPassword && newPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    {newPassword === confirmNewPassword
                      ? <><CheckCircle className="w-3 h-3 text-emerald-500" /><p className="text-[11px] text-emerald-500">Passwords match</p></>
                      : <><AlertCircle className="w-3 h-3 text-amber-500" /><p className="text-[11px] text-amber-500">Passwords do not match</p></>}
                  </div>
                )}
              </div>
              {errorBox}
              <Button
                type="submit"
                disabled={isPending || otp.length !== 6}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 transition-all duration-200"
                data-testid="button-reset-password"
              >
                {resetMutation.isPending ? "Updating password…" : "Update password"}
              </Button>
            </form>
            <div className="text-center mt-5">
              <p className="text-xs text-slate-400">
                Didn't receive it?{" "}
                {resendCooldown > 0 ? (
                  <span className="text-slate-400">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setError(""); forgotMutation.mutate(); }}
                    disabled={forgotMutation.isPending}
                    className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors inline-flex items-center gap-1"
                    data-testid="button-resend-reset"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend code
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Sign In / Sign Up ────────────────────────────────── */
  return (
    <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
      {brandPanel}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {mobileLogo}
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              {mode === "signin" ? "Sign in to your agency dashboard" : "Start managing your events today"}
            </p>
          </div>

          {/* Google OAuth */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm mb-4"
            data-testid="button-google-login"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-[#f4f5f8] dark:bg-slate-950 px-3 text-slate-400 font-medium uppercase tracking-wide">or continue with email</span>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-5 gap-1">
            <button
              type="button"
              onClick={() => switchToMode("signin")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "signin"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
              data-testid="tab-signin"
            >Sign In</button>
            <button
              type="button"
              onClick={() => switchToMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === "signup"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
              data-testid="tab-signup"
            >Sign Up</button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" autoComplete="email" data-testid="input-email" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => { setEmail(email); switchToMode("forgot-password"); }}
                    className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
                    data-testid="button-forgot-password"
                  >Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" autoComplete="current-password" data-testid="input-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {errorBox}
              <Button type="submit" disabled={isPending}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 mt-2 transition-all duration-200" data-testid="button-submit">
                {signinMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="text" placeholder="Jane Smith" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" autoComplete="name" data-testid="input-fullname" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" autoComplete="email" data-testid="input-email" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" autoComplete="new-password" data-testid="input-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type={showConfirmPw ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" autoComplete="new-password" data-testid="input-confirm-password" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              {errorBox}
              <Button type="submit" disabled={isPending}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 mt-2 transition-all duration-200" data-testid="button-submit">
                {signupMutation.isPending ? "Creating account…" : "Create account"}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-slate-400 mt-6">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => switchToMode(mode === "signin" ? "signup" : "signin")}
              className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
