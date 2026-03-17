import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSettings, applyTheme, applyAccentColor } from "@/context/SettingsContext";
import type {
  ProfileSettings,
  BusinessSettings,
  NotificationSettings,
  AppearanceSettings,
  SecuritySettings,
} from "@/context/SettingsContext";
import {
  User, Bell, Palette, Shield,
  Building2, Globe, Phone, Mail, MapPin, Clock,
  Check, Zap, Star, ChevronRight,
  Sun, Moon, Monitor, Lock,
  HelpCircle, MessageSquare, ExternalLink, LogOut,
} from "lucide-react";
import { useLocation } from "wouter";

/* ─── Toggle switch ─── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${on ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
    >
      <span className={`inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

/* ─── Nav config ─── */
const NAV_SECTIONS = [
  {
    group: "Account",
    items: [
      { id: "profile",  label: "Profile",       desc: "Name, email, avatar & bio",        icon: User },
      { id: "business", label: "Business",       desc: "Agency info & contact details",    icon: Building2 },
      { id: "security", label: "Security",       desc: "Password & two-factor auth",       icon: Shield },
    ],
  },
  {
    group: "Preferences",
    items: [
      { id: "notifications", label: "Notifications", desc: "Alerts, reminders & reports", icon: Bell },
      { id: "appearance",    label: "Appearance",    desc: "Theme, colors & layout",       icon: Palette },
    ],
  },
  {
    group: "Help",
    items: [
      { id: "support", label: "Support & Help", desc: "Docs, chat & changelog",           icon: HelpCircle },
    ],
  },
] as const;

type TabId = "profile" | "business" | "security" | "notifications" | "appearance" | "support";

export default function Settings() {
  const { toast } = useToast();
  const { profile } = useSettings();
  const [tab, setTab] = useState<TabId | null>(null);
  const [, navigate] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("ee_auth");
    navigate("/login");
  };

  const activeItem = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.id === tab);

  /* ── Sidebar panel ── */
  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Profile summary */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={profile.avatarUrl || "https://github.com/shadcn.png"}
              alt="avatar"
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-100 dark:ring-indigo-900"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://github.com/shadcn.png"; }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{profile.name}</p>
            <p className="text-xs text-slate-400 truncate">{profile.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {NAV_SECTIONS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 px-2 mb-1.5">{group}</p>
            <div className="space-y-0.5">
              {items.map(({ id, label, desc, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                      active
                        ? "bg-indigo-600 shadow-sm shadow-indigo-900/20"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/70"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      active ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    }`}>
                      <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold leading-none ${active ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>{label}</p>
                      <p className={`text-[11px] mt-0.5 truncate ${active ? "text-white/70" : "text-slate-400"}`}>{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleLogout}
          data-testid="button-logout"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <Layout title="Settings">
      {/* Full-bleed two-panel layout */}
      <div className="flex -mx-3 md:-mx-6 -mt-4 md:-mt-5 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900" style={{ minHeight: "calc(100vh - 130px)" }}>

        {/* ── Left sidebar ── */}
        {/* Desktop: always visible */}
        <div className={`hidden md:flex flex-col w-64 shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80`}>
          <div className="h-14 flex items-center px-5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">Settings</p>
          </div>
          {sidebar}
        </div>

        {/* Mobile: list view (shown when no tab selected) */}
        <div className={`md:hidden flex flex-col w-full border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 ${tab ? "hidden" : "flex"}`}>
          <div className="h-14 flex items-center px-5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">Settings</p>
          </div>
          {sidebar}
        </div>

        {/* ── Right content panel ── */}
        {/* Desktop: always visible */}
        <div className="hidden md:flex flex-col flex-1 min-w-0 bg-white dark:bg-slate-950">
          <div className="h-14 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
            {activeItem ? (
              <div className="flex items-center gap-2.5">
                <activeItem.icon className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-none">{activeItem.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{activeItem.desc}</p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-slate-400">Select a settings category</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {!tab && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choose a setting</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Select a category from the left to get started</p>
              </div>
            )}
            {tab === "profile"       && <ProfileTab toast={toast} />}
            {tab === "business"      && <BusinessTab toast={toast} />}
            {tab === "notifications" && <NotificationsTab toast={toast} />}
            {tab === "appearance"    && <AppearanceTab toast={toast} />}
            {tab === "security"      && <SecurityTab toast={toast} />}
            {tab === "support"       && <SupportTab />}
          </div>
        </div>

        {/* Mobile: content view (shown when tab is selected) */}
        <div className={`md:hidden flex-col flex-1 min-w-0 bg-white dark:bg-slate-950 ${tab ? "flex" : "hidden"}`}>
          <div className="h-14 flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setTab(null)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-500 rotate-180" />
            </button>
            {activeItem && (
              <div>
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200 leading-none">{activeItem.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{activeItem.desc}</p>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {tab === "profile"       && <ProfileTab toast={toast} />}
            {tab === "business"      && <BusinessTab toast={toast} />}
            {tab === "notifications" && <NotificationsTab toast={toast} />}
            {tab === "appearance"    && <AppearanceTab toast={toast} />}
            {tab === "security"      && <SecurityTab toast={toast} />}
            {tab === "support"       && <SupportTab />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ─── Profile tab ─── */
function ProfileTab({ toast }: { toast: any }) {
  const { profile, updateProfile, isLoaded } = useSettings();
  const [form, setForm] = useState<ProfileSettings>({ ...profile });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded) setForm({ ...profile });
  }, [isLoaded]);

  const F = (k: keyof ProfileSettings) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save_ = async () => {
    setSaving(true);
    await updateProfile(form);
    setSaving(false);
    toast({ title: "Profile saved", description: "Your profile has been updated." });
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Your Profile" description="Personal information visible to your team" />

      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-5 flex items-center gap-5">
          <div className="relative shrink-0">
            <img
              src={form.avatarUrl || "https://github.com/shadcn.png"}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-100"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://github.com/shadcn.png"; }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{form.name || "Your Name"}</p>
            <p className="text-xs text-slate-400 mt-0.5">{form.role} · {form.email}</p>
            <p className="text-xs text-slate-400 mt-2">To update your photo, paste an image URL below</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" value={form.name} onChange={F("name")} placeholder="Alex Morgan" />
            <Field label="Email Address" value={form.email} onChange={F("email")} placeholder="you@company.com" type="email" />
            <Field label="Phone" value={form.phone} onChange={F("phone")} placeholder="+1 555 0100" />
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Role</label>
              <select
                className="w-full h-9 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={form.role}
                onChange={F("role")}
              >
                {["Administrator","Manager","Planner","Coordinator","Viewer"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <Field label="Avatar URL" value={form.avatarUrl} onChange={F("avatarUrl")} placeholder="https://…" />
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={F("bio")}
              rows={3}
              placeholder="A short bio about yourself…"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
          <SaveBtn onClick={save_} loading={saving} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Business tab ─── */
function BusinessTab({ toast }: { toast: any }) {
  const { business, updateBusiness, isLoaded } = useSettings();
  const [form, setForm] = useState<BusinessSettings>({ ...business });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded) setForm({ ...business });
  }, [isLoaded]);

  const F = (k: keyof BusinessSettings) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const save_ = async () => {
    setSaving(true);
    await updateBusiness(form);
    setSaving(false);
    toast({ title: "Business profile saved", description: "Your business information has been updated." });
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Business Profile" description="Your agency's public-facing information and settings" />

      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
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
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5 block"><Clock className="w-3.5 h-3.5 text-slate-400" />Timezone</label>
              <select className="w-full h-9 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.timezone} onChange={F("timezone")}>
                {["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Toronto","Europe/London","Europe/Paris","Europe/Berlin","Asia/Dubai","Asia/Singapore","Asia/Tokyo","Australia/Sydney"].map((tz) => <option key={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Default Currency</label>
              <select className="w-full h-9 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" value={form.currency} onChange={F("currency")}>
                {["USD","EUR","GBP","CAD","AUD","AED","SGD","JPY"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Field label="Logo URL" value={form.logoUrl} onChange={F("logoUrl")} placeholder="https://cdn.company.com/logo.png" />
          <SaveBtn onClick={save_} loading={saving} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Notifications tab ─── */
function NotificationsTab({ toast }: { toast: any }) {
  const { notifications, updateNotifications, isLoaded } = useSettings();
  const [notifs, setNotifs] = useState<NotificationSettings>({ ...notifications });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded) setNotifs({ ...notifications });
  }, [isLoaded]);

  const toggle = (k: keyof NotificationSettings) => (v: boolean) => setNotifs((p) => ({ ...p, [k]: v }));

  const save_ = async () => {
    setSaving(true);
    await updateNotifications(notifs);
    setSaving(false);
    toast({ title: "Notification preferences saved" });
  };

  const groups: { title: string; items: { key: keyof NotificationSettings; label: string; desc: string }[] }[] = [
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
        { key: "quoteAccepted",   label: "Quote accepted",   desc: "Notify when a client accepts a quotation" },
        { key: "quotePending",    label: "Quote expiring",   desc: "Alert when a quote is about to expire" },
        { key: "paymentReceived", label: "Payment received", desc: "Notify when a client payment is logged" },
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
        <Card key={g.title} className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{g.title}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-4">
            {g.items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <Toggle on={notifs[key]} onChange={toggle(key)} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <SaveBtn onClick={save_} loading={saving} label="Save Preferences" />
    </div>
  );
}

/* ─── Appearance tab ─── */
function AppearanceTab({ toast }: { toast: any }) {
  const { appearance, updateAppearance, isLoaded } = useSettings();
  const [app, setApp] = useState<AppearanceSettings>({ ...appearance });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoaded) setApp({ ...appearance });
  }, [isLoaded]);

  const set = async (k: keyof AppearanceSettings, v: any) => {
    const newApp = { ...app, [k]: v };
    setApp(newApp);
    if (k === "theme") applyTheme(v as AppearanceSettings["theme"]);
    if (k === "accentColor") applyAccentColor(v);
    await updateAppearance(newApp);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const save_ = async () => {
    await updateAppearance(app);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: "Appearance settings saved", description: `Theme set to ${app.theme}` });
  };

  const themes: { id: AppearanceSettings["theme"]; label: string; icon: any }[] = [
    { id: "light",  label: "Light",  icon: Sun },
    { id: "system", label: "System", icon: Monitor },
    { id: "dark",   label: "Dark",   icon: Moon },
  ];

  const densities: { id: AppearanceSettings["density"]; label: string; desc: string }[] = [
    { id: "compact",     label: "Compact",     desc: "Denser layout — more on screen" },
    { id: "comfortable", label: "Comfortable", desc: "Balanced spacing (default)" },
    { id: "spacious",    label: "Spacious",    desc: "More breathing room" },
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

      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-5 space-y-6">
          {/* Theme */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => set("theme", id)}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${app.theme === id ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-600"}`}
                >
                  <Icon className={`w-5 h-5 ${app.theme === id ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className={`text-xs font-semibold ${app.theme === id ? "text-indigo-700 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Layout Density</p>
            <div className="space-y-2">
              {densities.map(({ id, label, desc }) => (
                <button
                  key={id}
                  onClick={() => set("density", id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${app.density === id ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950" : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-600"}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${app.density === id ? "border-indigo-600" : "border-slate-300 dark:border-slate-600"}`}>
                    {app.density === id && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${app.density === id ? "text-indigo-800 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"}`}>{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Accent Color</p>
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
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              { key: "animationsEnabled" as const, label: "Animations",        desc: "Smooth transitions and micro-animations" },
              { key: "sidebarCollapsed"  as const, label: "Collapse sidebar",  desc: "Start with the sidebar in icon-only mode" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <Toggle on={app[key] as boolean} onChange={(v) => set(key, v)} />
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
  const { security, updateSecurity, isLoaded } = useSettings();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [sec, setSec] = useState<SecuritySettings>({ ...security });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded) setSec({ ...security });
  }, [isLoaded]);

  const F = (k: string) => (e: any) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const changePassword = () => {
    if (!form.current) return toast({ title: "Enter your current password", variant: "destructive" });
    if (!form.next || form.next.length < 8) return toast({ title: "New password must be at least 8 characters", variant: "destructive" });
    if (form.next !== form.confirm) return toast({ title: "Passwords do not match", variant: "destructive" });
    setForm({ current: "", next: "", confirm: "" });
    toast({ title: "Password updated", description: "Your password has been changed successfully." });
  };

  const toggleSec = (k: keyof SecuritySettings) => async (v: boolean) => {
    const updated = { ...sec, [k]: v };
    setSec(updated);
    setSaving(true);
    await updateSecurity(updated);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Security" description="Manage your password and account security settings" />

      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          <Field label="Current Password" value={form.current} onChange={F("current")} placeholder="••••••••" type="password" />
          <Field label="New Password"     value={form.next}    onChange={F("next")}    placeholder="Min. 8 characters" type="password" />
          <Field label="Confirm Password" value={form.confirm} onChange={F("confirm")} placeholder="Must match new password" type="password" />
          <Button onClick={changePassword} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm">Update Password</Button>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-[13px] font-bold text-slate-800 dark:text-slate-200">Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {([
            { key: "twofa"         as const, label: "Two-Factor Authentication", desc: "Require a code from your authenticator app on each login" },
            { key: "sessionAlerts" as const, label: "Session Alerts",            desc: "Email me when a new device signs into my account" },
          ]).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <Toggle on={sec[key]} onChange={toggleSec(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-red-100 bg-red-50 dark:bg-red-950/30 dark:border-red-900 rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Danger Zone</p>
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
    {
      icon: MessageSquare,
      label: "Live Chat",
      desc: "Talk to our team — typically replies in < 5 min",
      cta: "Open Chat",
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
      onClick: () => window.open("mailto:chat@eventelite.com?subject=Live%20Chat%20Request", "_blank"),
    },
    {
      icon: Mail,
      label: "Email Support",
      desc: "Send us an email and we'll respond within 24 hours",
      cta: "Send Email",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      onClick: () => window.open("mailto:support@eventelite.com?subject=Support%20Request", "_blank"),
    },
    {
      icon: HelpCircle,
      label: "Help Center",
      desc: "Browse articles, tutorials and FAQs",
      cta: "Browse Docs",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      onClick: () => window.open("https://docs.eventelite.com", "_blank"),
    },
    {
      icon: ExternalLink,
      label: "Changelog",
      desc: "See what's new in the latest EventElite updates",
      cta: "View Updates",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      onClick: () => window.open("https://eventelite.com/changelog", "_blank"),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Support & Help" description="Get help, browse documentation, or contact our team" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map(({ icon: Icon, label, desc, cta, color, bg, onClick }) => (
          <Card
            key={label}
            className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={onClick}
          >
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{label}</p>
              <p className="text-xs text-slate-400 mt-1 mb-3">{desc}</p>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                {cta} <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Enjoying EventElite?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Leave us a review or share feedback to help us improve.</p>
          </div>
          <Button
            className="ml-auto h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs shrink-0"
            onClick={() => window.open("mailto:feedback@eventelite.com?subject=EventElite%20Feedback", "_blank")}
          >
            Give Feedback
          </Button>
        </CardContent>
      </Card>

      <div className="text-center py-4">
        <p className="text-xs text-slate-400">
          EventElite v2.4.0 ·{" "}
          <a href="https://eventelite.com/privacy" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Privacy Policy</a>
          {" "}·{" "}
          <a href="https://eventelite.com/terms" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}

/* ─── Shared components ─── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-1">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
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
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>}
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-9 rounded-xl text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${icon ? "pl-9" : ""}`}
        />
      </div>
    </div>
  );
}

function SaveBtn({ onClick, label = "Save Changes", loading = false }: { onClick: () => void; label?: string; loading?: boolean }) {
  const [saved, setSaved] = useState(false);
  const handle = async () => {
    await onClick();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <Button onClick={handle} disabled={loading} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold">
      {loading ? (
        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 animate-pulse" />Saving…</span>
      ) : saved ? (
        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" />Saved!</span>
      ) : label}
    </Button>
  );
}
