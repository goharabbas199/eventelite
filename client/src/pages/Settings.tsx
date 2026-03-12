import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Shield, Palette, Database, ChevronRight, User } from "lucide-react";

const settingsSections = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your account information and preferences",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure event reminders and alert preferences",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the look and feel of your dashboard",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Manage passwords, two-factor authentication, and access",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Database,
    title: "Data & Privacy",
    description: "Export your data, manage backups, and privacy controls",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

export default function Settings() {
  return (
    <Layout title="Settings">
      <div className="max-w-2xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Account</p>
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-400 mt-1">Manage your preferences and account configuration</p>
        </div>

        <Card className="border border-border/60 rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            {settingsSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.title}
                  className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left group ${idx !== 0 ? "border-t border-border/40" : ""}`}
                >
                  <div className={`p-2.5 rounded-xl ${section.bg} shrink-0`}>
                    <Icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{section.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{section.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
          <p className="text-xs text-indigo-600 font-medium">Settings features coming soon in the next update</p>
        </div>
      </div>
    </Layout>
  );
}
