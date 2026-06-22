import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Eye, EyeOff, Lock, Mail, AlertCircle, User, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

type Mode = "signin" | "signup" | "email-sent" | "forgot-password";

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

const FIREBASE_READY = isFirebaseConfigured();

// ── Google logo ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.215 17.64 11.907 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Login() {
  const [, navigate]   = useLocation();
  const queryClient    = useQueryClient();
  const { toast }      = useToast();

  const [mode, setMode]                       = useState<Mode>("signin");
  const [fullName, setFullName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw]                   = useState(false);
  const [showConfirmPw, setShowConfirmPw]     = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [emailSentType, setEmailSentType]     = useState<"verify" | "reset">("verify");
  const [sentToEmail, setSentToEmail]         = useState("");

  const onAuthSuccess = (user: any) => {
    queryClient.setQueryData(["/api/auth/me"], user);
    navigate("/");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  // ── Shared: sign in via Firebase ID token → Express session ───────────────
  const loginWithToken = async (idToken: string, name?: string) => {
    const user = await apiPost("/api/auth/firebase", { idToken, fullName: name });
    return user;
  };

  // ── Google sign-in ─────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    if (!FIREBASE_READY || !firebaseAuth) {
      setError("Google Sign-In is not configured. Please add Firebase credentials.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(firebaseAuth, provider);
      const idToken  = await result.user.getIdToken();
      const user     = await loginWithToken(idToken);
      toast({ title: "Signed in with Google!", description: `Welcome, ${user.fullName.split(" ")[0]}!` });
      onAuthSuccess(user);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email/password sign in ─────────────────────────────────────────────────
  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!FIREBASE_READY || !firebaseAuth) {
      setError("Firebase is not configured. Please add VITE_FIREBASE_* credentials.");
      return;
    }
    if (!email.trim()) return setError("Email is required");
    if (!password)     return setError("Password is required");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        setSentToEmail(cred.user.email || email.trim());
        setEmailSentType("verify");
        setMode("email-sent");
        toast({ title: "Verification email resent", description: "Please check your inbox and click the link." });
        return;
      }
      const idToken = await cred.user.getIdToken();
      const user    = await loginWithToken(idToken);
      toast({ title: "Welcome back!", description: `Signed in as ${user.fullName.split(" ")[0]}.` });
      onAuthSuccess(user);
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(err.message || "Sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email/password sign up ─────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!FIREBASE_READY || !firebaseAuth) {
      setError("Firebase is not configured. Please add VITE_FIREBASE_* credentials.");
      return;
    }
    if (!fullName.trim())           return setError("Full name is required");
    if (!email.trim())              return setError("Email is required");
    if (password.length < 8)        return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      await updateProfile(cred.user, { displayName: fullName.trim() });
      await sendEmailVerification(cred.user);
      setSentToEmail(cred.user.email || email.trim());
      setEmailSentType("verify");
      setMode("email-sent");
      toast({ title: "Account created!", description: "Check your inbox for the verification link." });
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else {
        setError(err.message || "Sign up failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!FIREBASE_READY || !firebaseAuth) {
      setError("Firebase is not configured. Please add VITE_FIREBASE_* credentials.");
      return;
    }
    if (!email.trim()) return setError("Please enter your email address");
    setLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setSentToEmail(email.trim());
      setEmailSentType("reset");
      setMode("email-sent");
      toast({ title: "Reset email sent!", description: "Check your inbox for the password reset link." });
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/user-not-found") {
        setSentToEmail(email.trim());
        setEmailSentType("reset");
        setMode("email-sent");
      } else {
        setError(err.message || "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Shared UI ──────────────────────────────────────────────────────────────
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
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/60 text-[11px] font-medium">{f}</span>
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

  const googleBtn = (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading}
      data-testid="button-google-signin"
      className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-200 disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
      Continue with Google
    </button>
  );

  const divider = (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">or continue with email</span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  );

  // ── Email sent screen (verification or password reset) ─────────────────────
  if (mode === "email-sent") {
    const isVerify = emailSentType === "verify";
    return (
      <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
        {brandPanel}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          {mobileLogo}
          <div className="w-full max-w-sm text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <MailCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              {isVerify ? "Check your inbox" : "Reset email sent"}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-1">
              {isVerify
                ? "We sent a verification link to"
                : "We sent a password reset link to"}
            </p>
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-6">{sentToEmail}</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">
              {isVerify
                ? "Click the link in the email to verify your account, then come back here and sign in."
                : "Click the link in the email to choose a new password, then sign in."}
            </p>
            <Button
              onClick={() => switchMode("signin")}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              data-testid="button-back-to-signin"
            >
              Back to sign in
            </Button>
            {isVerify && (
              <p className="text-xs text-slate-400 mt-4">
                Didn't get it? Check your spam folder, or{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                >
                  try signing up again
                </button>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot password screen ─────────────────────────────────────────────────
  if (mode === "forgot-password") {
    return (
      <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
        {brandPanel}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          {mobileLogo}
          <div className="w-full max-w-sm">
            <button onClick={() => switchMode("signin")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-6 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </button>
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Forgot password?</h2>
              <p className="text-slate-400 text-sm mt-1.5">Enter your email and we'll send a reset link.</p>
            </div>
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    autoComplete="email" data-testid="input-forgot-email" />
                </div>
              </div>
              {errorBox}
              <Button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 transition-all duration-200"
                data-testid="button-send-reset">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending…</> : "Send reset link"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign in / Sign up screen ───────────────────────────────────────────────
  const isSignup = mode === "signup";
  return (
    <div className="min-h-screen flex bg-[#f4f5f8] dark:bg-slate-950">
      {brandPanel}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {mobileLogo}
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              {isSignup ? "Start managing your events today." : "Sign in to your agency dashboard"}
            </p>
          </div>

          {googleBtn}
          {divider}

          {/* Sign in / Sign up tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 mb-5">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              data-testid="tab-signin"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                !isSignup ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              data-testid="tab-signup"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                isSignup ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={isSignup ? handleSignup : handleSignin} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type="text" placeholder="Jane Smith" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    autoComplete="name" data-testid="input-fullname" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  autoComplete="email" data-testid="input-email" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
                {!isSignup && (
                  <button type="button" onClick={() => switchMode("forgot-password")}
                    className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                    data-testid="button-forgot-password">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  data-testid="input-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isSignup && <p className="text-[11px] text-slate-400 mt-1">Minimum 8 characters</p>}
            </div>

            {isSignup && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input type={showConfirmPw ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    autoComplete="new-password" data-testid="input-confirm-password" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {errorBox}

            <Button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-900/20 transition-all duration-200"
              data-testid={isSignup ? "button-signup" : "button-signin"}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isSignup ? "Creating account…" : "Signing in…"}</>
                : isSignup ? "Create account" : "Sign in"
              }
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button type="button"
              onClick={() => switchMode(isSignup ? "signin" : "signup")}
              className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors"
              data-testid={isSignup ? "link-signin" : "link-signup"}>
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
