import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  User, Bell, Palette, Shield,
  Building2, Globe, Phone, Mail, MapPin, Clock,
  Check, Zap, Star, ChevronRight,
  Sun, Moon, Monitor, Lock,
  HelpCircle, MessageSquare, ExternalLink,
} from "lucide-react";

/* ─── Persistent helpers ─── */
function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}
function save(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* ─── Toggle switch ─── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${on ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

/* ─── Tabs ─── */
const TABS = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "business",      label: "Business",      icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "support",       label: "Support",       icon: HelpCircle },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Settings() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <Layout title="Settings">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Account</p>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Manage your workspace preferences and account configuration</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="md:w-52 shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  tab === id
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          {tab === "profile"       && <ProfileTab toast={toast} />}
          {tab === "business"      && <BusinessTab toast={toast} />}
          {tab === "notifications" && <NotificationsTab toast={toast} />}
          {tab === "appearance"    && <AppearanceTab toast={toast} />}
          {tab === "security"      && <SecurityTab toast={toast} />}
          {tab === "support"       && <SupportTab />}
        </div>
      </div>
    </Layout>
  );
}

/* ─── Profile tab ─── */
function ProfileTab({ toast }: { toast: any }) {
  const [form, setForm] = useState(() => load("settings_profile", {
    name: "Alex Morgan", email: "alex@eventelite.com",
    phone: "+1 555 0100", role: "Administrator",
    avatarUrl: "https://github.com/shadcn.png", bio: "",
  }));

  const save_ = () => { save("settings_profile", form); toast({ title: "Profile saved", description: "Your profile has been updated." }); };
  const F = (k: string) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <SectionHeader title="Your Profile" description="Personal information visible to your team" />

      {/* Avatar */}
      <Card className="border border-slate-100 rounded-2xl shadow-sm">
        <CardContent className="p-5 flex items-center gap-5">
          <div className="relative shrink-0">
            <img src={form.avatarUrl || "https://github.com/shadcn.png"} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-100" onError={(e) => { (e.target as HTMLImageElement).src = "https://github.com/shadcn.png"; }} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">{form.name || "Your Name"}</p>
            <p className="text-xs text-slate-400 mt-0.5">{form.role} · {form.email}</p>
            <p className="text-xs text-slate-400 mt-2">To update your photo, paste an image URL below</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 rounded-2xl shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" value={form.name} onChange={F("name")} placeholder="Alex Morgan" />
            <Field label="Email Address" value={form.email} onChange={F("email")} placeholder="you@company.com" type="email" />
            <Field label="Phone" value={form.phone} onChange={F("phone")} placeholder="+1 555 0100" />
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role</label>
              <select className="w-full h-9 border border-slate-200 rounded-xl px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.role} onChange={F("role")}>
                {["Administrator","Manager","Planner","Coordinator","Viewer"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <Field label="Avatar URL" value={form.avatarUrl} onChange={F("avatarUrl")} placeholder="https://…" />
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={F("bio")}
              rows={3}
              placeholder="A short bio about yourself…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
          <SaveBtn onClick={save_} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Business tab ─── */
function BusinessTab({ toast }: { toast: any }) {
  const [form, setForm] = useState(() => load("settings_business", {
    companyName: "EventElite Agency", email: "hello@eventelite.com",
    phone: "+1 555 0200", website: "https://eventelite.com",
    address: "123 Event Blvd, Suite 400", city: "New York", state: "NY",
    country: "United States", timezone: "America/New_York",
    currency: "USD", taxId: "", logoUrl: "",
  }));

  const save_ = () => { save("settings_business", form); toast({ title: "Business profile saved" }); };
  const F = (k: string) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <SectionHeader title="Business Profile" description="Your agency's public-facing information and settings" />

      <Card className="border border-slate-100 rounded-2xl shadow-sm">
        <CardContent className="p-5 space-y-4">
          <Field label="Agency / Company Name" value={form.companyName} onChange={F("companyName")} placeholder="EventElite Agency" icon={<Building2 className="w-3.5 h-3.5 text-slate-400" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Email" value={form.email} onChange={F("email")} placeholder="hello@company.com" type="email" icon={<Mail className="w-3.5 h-3.5 text-slate-400" />} />
            <Field label="Business Phone" value={form.phone} onChange={F("phone")} placeholder="+1 555 0200" icon={<Phone className="w-3.5 h-3.5 text-slate-400" />} />
            <Field label="Website" value={form.website} onChange={F("website")} placeholder="https://company.com" icon={<Globe className="w-3.5 h-3.5 text-slate-400" />} />
            <Field label="Tax ID / EIN" value={form.taxId} onChange={F("taxId")} placeholder="12-3456789" />
          </div>
          <Field label="Street Address" value={form.address} onChange={F("address")} placeholder="123 Main St, Suite 100" icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="City" value={form.city} onChange={F("city")} placeholder="New York" />
            <Field label="State / Province" value={form.state} onChange={F("state")} placeholder="NY" />
            <Field label="Country" value={form.country} onChange={F("country")} placeholder="United States" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" />Timezone</label>
              <select className="w-full h-9 border border-slate-200 rounded-xl px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.timezone} onChange={F("timezone")}>
                {["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Toronto","Europe/London","Europe/Paris","Europe/Berlin","Asia/Dubai","Asia/Singapore","Asia/Tokyo","Australia/Sydney"].map((tz) => <option key={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Default Currency</label>
              <select className="w-full h-9 border border-slate-200 rounded-xl px-3 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.currency} onChange={F("currency")}>
                {["USD","EUR","GBP","CAD","AUD","AED","SGD","JPY"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Field label="Logo URL" value={form.logoUrl} onChange={F("logoUrl")} placeholder="https://cdn.company.com/logo.png" />
          <SaveBtn onClick={save_} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Notifications tab ─── */
function NotificationsTab({ toast }: { toast: any }) {
  const [notifs, setNotifs] = useState(() => load("settings_notifications", {
    emailReminders: true, upcomingEvents: true, newClientAlert: true,
    quoteAccepted: true, quotePending: false, paymentReceived: true,
    vendorUpdates: false, weeklyReport: true, marketingTips: false,
  }));

  const toggle = (k: string) => (v: boolean) => setNotifs((p) => ({ ...p, [k]: v }));
  const save_ = () => { save("settings_notifications", notifs); toast({ title: "Notification preferences saved" }); };

  const groups = [
    {
      title: "Event Alerts",
      items: [
        { key: "upcomingEvents",  label: "Upcoming event reminders",  desc: "Get notified 7 days and 1 day before events" },
        { key: "emailReminders",  label: "Email reminders",           desc: "Daily summary of tasks and upcoming deadlines" },
        { key: "newClientAlert",  label: "New client added",          desc: "Alert when a new client event is created" },
      ],
    },
    {
      title: "Sales & Quotes",
      items: [
        { key: "quoteAccepted",  label: "Quote accepted",   desc: "Notify when a client accepts a quotation" },
        { key: "quotePending",   label: "Quote expiring",   desc: "Alert when a quote is about to expire" },
        { key: "paymentReceived",label: "Payment received", desc: "Notify when a client payment is logged" },
      ],
    },
    {
      title: "System & Reports",
      items: [
        { key: "vendorUpdates",  label: "Vendor / venue changes", desc: "Notify when vendor details are updated" },
        { key: "weeklyReport",   label: "Weekly digest",          desc: "Summary email every Monday morning" },
        { key: "marketingTips",  label: "Product tips & updates", desc: "Occasional tips on new features and best practices" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Notifications" description="Choose when and how you want to be notified" />
      {groups.map((g) => (
        <Card key={g.title} className="border border-slate-100 rounded-2xl shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[13px] font-bold text-slate-800">{g.title}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-4">
            {g.items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <Toggle on={(notifs as any)[key]} onChange={toggle(key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <SaveBtn onClick={save_} label="Save Preferences" />
    </div>
  );
}

/* ─── Appearance tab ─── */
function AppearanceTab({ toast }: { toast: any }) {
  const [app, setApp] = useState(() => load("settings_appearance", {
    theme: "light", density: "comfortable", accentColor: "indigo",
    sidebarCollapsed: false, animationsEnabled: true,
  }));

  const save_ = () => { save("settings_appearance", app); toast({ title: "Appearance settings saved" }); };
  const set = (k: string, v: any) => setApp((p) => ({ ...p, [k]: v }));

  const themes = [
    { id: "light", label: "Light",  icon: Sun },
    { id: "system",label: "System", icon: Monitor },
    { id: "dark",  label: "Dark",   icon: Moon },
  ];

  const densities = [
    { id: "compact",      label: "Compact",      desc: "Denser layout — more on screen" },
    { id: "comfortable",  label: "Comfortable",  desc: "Balanced spacing (default)" },
    { id: "spacious",     label: "Spacious",     desc: "More breathing room" },
  ];

  const accents = [
    { id: "indigo",  color: "bg-indigo-600" },
    { id: "violet",  color: "bg-violet-600" },
    { id: "blue",    color: "bg-blue-600" },
    { id: "emerald", color: "bg-emerald-600" },
    { id: "rose",    color: "bg-rose-600" },
    { id: "amber",   color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Appearance" description="Customize the look and feel of your dashboard" />

      <Card className="border border-slate-100 rounded-2xl shadow-sm">
        <CardContent className="p-5 space-y-6">
          {/* Theme */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => set("theme", id)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${app.theme === id ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"}`}
                >
                  <Icon className={`w-5 h-5 ${app.theme === id ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className={`text-xs font-semibold ${app.theme === id ? "text-indigo-700" : "text-slate-500"}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3">Layout Density</p>
            <div className="space-y-2">
              {densities.map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => set("density", id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${app.density === id ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${app.density === id ? "border-indigo-600" : "border-slate-300"}`}>
                    {app.density === id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${app.density === id ? "text-indigo-800" : "text-slate-700"}`}>{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-3">Accent Color</p>
            <div className="flex gap-3">
              {accents.map(({ id, color }) => (
                <button
                  key={id}
                  onClick={() => set("accentColor", id)}
                  className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110 ${app.accentColor === id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {[
              { key: "animationsEnabled", label: "Animations",        desc: "Smooth transitions and micro-animations" },
              { key: "sidebarCollapsed",  label: "Collapse sidebar",  desc: "Start with the sidebar in icon-only mode" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <Toggle on={(app as any)[key]} onChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>

          <SaveBtn onClick={save_} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Security tab ─── */
function SecurityTab({ toast }: { toast: any }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [twofa, setTwofa] = useState(false);
  const [sessions, setSessions] = useState(true);
  const F = (k: string) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const changePassword = () => {
    if (!form.current || !form.next) return toast({ title: "Fill all fields", variant: "destructive" });
    if (form.next !== form.confirm) return toast({ title: "Passwords do not match", variant: "destructive" });
    setForm({ current: "", next: "", confirm: "" });
    toast({ title: "Password updated", description: "Your password has been changed successfully." });
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Security" description="Manage your password and account security settings" />

      <Card className="border border-slate-100 rounded-2xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-[13px] font-bold text-slate-800 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" />Change Password</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          <Field label="Current Password" value={form.current} onChange={F("current")} placeholder="••••••••" type="password" />
          <Field label="New Password"     value={form.next}    onChange={F("next")}    placeholder="Min. 8 characters" type="password" />
          <Field label="Confirm Password" value={form.confirm} onChange={F("confirm")} placeholder="Must match new password" type="password" />
          <Button onClick={changePassword} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm">Update Password</Button>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 rounded-2xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-[13px] font-bold text-slate-800">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {[
            { key: "twofa",    label: "Two-Factor Authentication", desc: "Require a code from your authenticator app on each login", val: twofa,    set: setTwofa },
            { key: "sessions", label: "Session Alerts",            desc: "Email me when a new device signs into my account",        val: sessions, set: setSessions },
          ].map(({ key, label, desc, val, set }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <Toggle on={val} onChange={set} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-red-100 bg-red-50 rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-bold text-red-700 mb-1">Danger Zone</p>
          <p className="text-xs text-red-500 mb-3">These actions are permanent and cannot be undone.</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="h-9 rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300">Delete My Account</Button>
            <Button variant="outline" className="h-9 rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300">Revoke All Sessions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Support tab ─── */
function SupportTab() {
  const links = [
    { icon: MessageSquare, label: "Live Chat",          desc: "Talk to our team — typically replies in < 5 min",    cta: "Open Chat",      color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: Mail,          label: "Email Support",       desc: "Send us an email and we'll respond within 24 hours", cta: "Send Email",     color: "text-blue-600",   bg: "bg-blue-50" },
    { icon: HelpCircle,    label: "Help Center",         desc: "Browse articles, tutorials and FAQs",                cta: "Browse Docs",    color: "text-emerald-600",bg: "bg-emerald-50" },
    { icon: ExternalLink,  label: "Changelog",           desc: "See what's new in the latest EventElite updates",   cta: "View Updates",   color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Support & Help" description="Get help, browse documentation, or contact our team" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map(({ icon: Icon, label, desc, cta, color, bg }) => (
          <Card key={label} className="border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{label}</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">{desc}</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                {cta} <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-slate-100 rounded-2xl shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Enjoying EventElite?</p>
            <p className="text-xs text-slate-500 mt-0.5">Leave us a review or share feedback to help us improve.</p>
          </div>
          <Button className="ml-auto h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs shrink-0">Give Feedback</Button>
        </CardContent>
      </Card>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">EventElite v2.4.0 · <a href="#" className="text-indigo-500 hover:underline">Privacy Policy</a> · <a href="#" className="text-indigo-500 hover:underline">Terms of Service</a></p>
      </div>
    </div>
  );
}

/* ─── Shared components ─── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-1">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", icon }: {
  label: string; value: string; onChange: (e: any) => void;
  placeholder?: string; type?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>}
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-9 rounded-xl text-sm border-slate-200 ${icon ? "pl-9" : ""}`}
        />
      </div>
    </div>
  );
}

function SaveBtn({ onClick, label = "Save Changes" }: { onClick: () => void; label?: string }) {
  const [saved, setSaved] = useState(false);
  const handle = () => { onClick(); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <Button onClick={handle} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold">
      {saved ? <><Check className="w-3.5 h-3.5 mr-1.5" />Saved!</> : label}
    </Button>
  );
}
