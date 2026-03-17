import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useSettings } from "@/context/SettingsContext";
import { StatsCard } from "@/components/StatsCard";
import {
  Users, Store, MapPin, DollarSign, TrendingUp, Wallet,
  Calendar, ChevronRight, Clock, ArrowUpRight, Plus,
  ReceiptText, PieChart, Zap, ArrowRight, Percent, AlertCircle,
} from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import { useInvoices } from "@/hooks/use-invoices";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { buildUrl, api } from "@shared/routes";
import { format, differenceInDays } from "date-fns";

const priorityConfig = (d: number) => {
  if (d < 0)   return { label: "Past",     cls: "badge-slate" };
  if (d <= 3)  return { label: "Urgent",   cls: "badge-red" };
  if (d <= 14) return { label: "Soon",     cls: "badge-amber" };
  return               { label: "Upcoming",cls: "badge-emerald" };
};

const statusStyle: Record<string, string> = {
  Lead:      "badge-blue",
  Pending:   "badge-amber",
  Confirmed: "badge-emerald",
  Completed: "badge-slate",
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl px-3.5 py-2.5">
      <p className="text-[11px] text-slate-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

export default function Dashboard() {
  const { profile, appearance } = useSettings();
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: vendors, isLoading: loadingVendors } = useVendors();
  const { data: venues,  isLoading: loadingVenues  } = useVenues();
  const { data: invoices = [] } = useInvoices();
  const [, navigate] = useLocation();
  const [range, setRange] = useState<"month" | "6months" | "year">("year");
  const [totalExpenses, setTotalExpenses] = useState(0);
  const isDark = appearance.theme === "dark" ||
    (appearance.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const totalRevenue = useMemo(
    () => clients?.reduce((s: number, c: any) => s + Number(c.budget || 0), 0) ?? 0,
    [clients]
  );

  useEffect(() => {
    if (!clients?.length) return;
    let cancelled = false;
    (async () => {
      let total = 0;
      await Promise.all(
        clients.map(async (client: any) => {
          const res = await fetch(buildUrl(api.clients.get.path, { id: client.id }));
          if (!res.ok) return;
          const d = await res.json();
          const s = (d.services || []).reduce((a: number, x: any) => a + Number(x.cost || 0), 0);
          const e = (d.expenses || []).reduce((a: number, x: any) => a + Number(x.cost || 0), 0);
          total += s + e;
        })
      );
      if (!cancelled) setTotalExpenses(total);
    })();
    return () => { cancelled = true; };
  }, [clients]);

  const netProfit   = totalRevenue - totalExpenses;
  const invoiceList = invoices as any[];
  const overdueInvoices = invoiceList.filter((i) => i.status === "overdue");
  const unpaidInvoiceAmount = invoiceList.filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.amount), 0);
  const activeClients = clients?.filter((c: any) => c.status === "Lead" || c.status === "Confirmed").length ?? 0;
  const completedClients = clients?.filter((c: any) => c.status === "Completed").length ?? 0;
  const winRate = (clients?.length ?? 0) > 0
    ? Math.round((completedClients / (clients?.length ?? 1)) * 100)
    : 0;
  const avgDealSize = (clients?.length ?? 0) > 0
    ? Math.round(totalRevenue / (clients?.length ?? 1))
    : 0;

  const upcomingEvents = useMemo(() => {
    if (!clients) return [];
    return clients
      .filter((c: any) => new Date(c.eventDate) > new Date())
      .sort((a: any, b: any) => +new Date(a.eventDate) - +new Date(b.eventDate))
      .slice(0, 5);
  }, [clients]);

  const recentClients = useMemo(() => {
    if (!clients) return [];
    return [...clients]
      .sort((a: any, b: any) => b.id - a.id)
      .slice(0, 5);
  }, [clients]);

  const revenueData = useMemo(() => {
    if (!clients) return [];
    const now = new Date();
    const months: Record<string, number> = {};
    clients.forEach((client: any) => {
      const date = new Date(client.eventDate);
      const diff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (
        (range === "month" && diff <= 1) ||
        (range === "6months" && diff <= 6) ||
        range === "year"
      ) {
        const key = date.toLocaleString("default", { month: "short" });
        months[key] = (months[key] || 0) + Number(client.budget || 0);
      }
    });
    return Object.entries(months).map(([name, revenue]) => ({ name, revenue }));
  }, [clients, range]);

  const gridStroke  = isDark ? "#1e293b" : "#f1f5f9";
  const axisColor   = isDark ? "#475569" : "#94a3b8";

  if (loadingClients || loadingVendors || loadingVenues) {
    return (
      <Layout title="Dashboard">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-12 w-full rounded-2xl mt-3" />
        <Skeleton className="h-72 w-full rounded-2xl mt-3" />
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* ── Greeting strip ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
          <h2 className="text-base md:text-xl font-bold text-slate-900 dark:text-white">Welcome back, {profile.name.split(" ")[0]} 👋</h2>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <p className="eyebrow mb-1">Pipeline value</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Quick Actions row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New Client",  icon: Users,       href: "/clients",    color: "from-indigo-600 to-indigo-500" },
          { label: "New Quote",   icon: ReceiptText,  href: "/quotations", color: "from-violet-600 to-violet-500" },
          { label: "Invoices",    icon: Calendar,     href: "/invoices",   color: "from-blue-600 to-blue-500" },
          { label: "Budget View", icon: PieChart,     href: "/budget",     color: "from-emerald-600 to-emerald-500" },
        ].map(({ label, icon: Icon, href, color }) => (
          <button
            key={label}
            onClick={() => navigate(href)}
            className={`flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl bg-gradient-to-r ${color} text-white text-xs md:text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150`}
          >
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
            <span className="truncate">{label}</span>
            <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-auto shrink-0 opacity-70 hidden sm:block" />
          </button>
        ))}
      </div>

      {/* ── Overdue invoices alert ── */}
      {overdueInvoices.length > 0 && (
        <div
          onClick={() => navigate("/invoices")}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-red-500 dark:text-red-500">
              ${unpaidInvoiceAmount.toLocaleString()} outstanding — click to review
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />
        </div>
      )}

      {/* ── Stats grid — 3 + 3 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard title="Active Clients"  value={activeClients}                           icon={Users}      color="blue"   subtitle="Leads & confirmed" onClick={() => navigate("/clients")} />
        <StatsCard title="Total Vendors"   value={vendors?.length ?? 0}                   icon={Store}      color="purple" subtitle="Service providers"  onClick={() => navigate("/vendors")} />
        <StatsCard title="Venues"          value={venues?.length ?? 0}                    icon={MapPin}     color="orange" subtitle="Event locations"    onClick={() => navigate("/venues")} />
        <StatsCard title="Total Revenue"   value={`$${totalRevenue.toLocaleString()}`}    icon={DollarSign} color="green"  subtitle="All budgets" />
        <StatsCard title="Total Expenses"  value={`$${totalExpenses.toLocaleString()}`}   icon={Wallet}     color="orange" subtitle="Services + misc." />
        <StatsCard title="Net Profit"      value={`$${netProfit.toLocaleString()}`}       icon={TrendingUp} color={netProfit >= 0 ? "green" : "red"} subtitle={netProfit >= 0 ? "Profitable" : "Loss"} />
      </div>

      {/* ── Performance KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Win Rate",
            value: `${winRate}%`,
            desc: `${completedClients} of ${clients?.length ?? 0} completed`,
            icon: Percent,
            color: winRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            bg:    winRate >= 50 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-amber-50 dark:bg-amber-950/40",
          },
          {
            label: "Avg Deal Size",
            value: `$${avgDealSize.toLocaleString()}`,
            desc: "Per client event",
            icon: DollarSign,
            color: "text-indigo-600 dark:text-indigo-400",
            bg:    "bg-indigo-50 dark:bg-indigo-950/40",
          },
          {
            label: "Events This Month",
            value: String(
              clients?.filter((c: any) => {
                const d = new Date(c.eventDate);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length ?? 0
            ),
            desc: "Scheduled for current month",
            icon: Calendar,
            color: "text-purple-600 dark:text-purple-400",
            bg:    "bg-purple-50 dark:bg-purple-950/40",
          },
          {
            label: "Profit Margin",
            value: totalRevenue > 0 ? `${Math.round((netProfit / totalRevenue) * 100)}%` : "—",
            desc: "Revenue vs. expenses",
            icon: TrendingUp,
            color: netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
            bg:    netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40",
          },
        ].map(({ label, value, desc, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-tight">{label}</p>
              <div className={`p-1.5 rounded-lg ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-xl md:text-2xl font-black tracking-tight ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Chart + Upcoming Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
          <CardHeader className="flex flex-row items-start justify-between pb-0 pt-4 px-5">
            <div>
              <CardTitle className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Revenue Overview</CardTitle>
              <p className="text-[11px] text-slate-400 mt-0.5">Client budgets over time</p>
            </div>
            <div className="flex bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl p-0.5 gap-0.5">
              {(["month", "6months", "year"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    range === r
                      ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  {r === "month" ? "1M" : r === "6months" ? "6M" : "1Y"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-4 pb-4">
            {revenueData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 font-medium">No revenue data for this period</p>
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={isDark ? 0.2 : 0.12} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2}
                      fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
          <CardHeader className="pb-0 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Upcoming Events</CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">{upcomingEvents.length} scheduled</p>
              </div>
              <Calendar className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-3 pb-3">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">No upcoming events</p>
                <Button onClick={() => navigate("/clients")} variant="outline" className="mt-1 h-8 rounded-xl text-xs">
                  Add your first client
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {upcomingEvents.map((event: any) => {
                  const daysLeft = differenceInDays(new Date(event.eventDate), new Date());
                  const p = priorityConfig(daysLeft);
                  return (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/clients/${event.id}`)}
                      className="flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-all duration-100 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                          <p className="text-[10px] text-slate-400">{format(new Date(event.eventDate), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                        <span className={`chip ${p.cls}`}>{p.label}</span>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => navigate("/clients")}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  View all clients <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Clients + Pipeline Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent clients */}
        <Card className="lg:col-span-3 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
          <CardHeader className="pb-0 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Recent Clients</CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">Latest added to your pipeline</p>
              </div>
              <button onClick={() => navigate("/clients")} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-3 pb-3">
            {recentClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">No clients yet</p>
                <Button onClick={() => navigate("/clients")} size="sm" className="mt-1 h-8 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add first client
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
                {recentClients.map((client: any) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl gradient-indigo flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-white">
                        {client.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{client.name}</p>
                      <p className="text-[10px] text-slate-400">{client.eventType} · {format(new Date(client.eventDate), "MMM d, yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`chip ${statusStyle[client.status] || "badge-slate"}`}>{client.status}</span>
                      <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300 hidden sm:block">
                        {client.budget ? `$${Number(client.budget).toLocaleString()}` : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline by status */}
        <Card className="lg:col-span-2 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
          <CardHeader className="pb-0 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px] font-bold text-slate-900 dark:text-slate-100">Pipeline Status</CardTitle>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-5 pb-5 space-y-3">
            {(() => {
              const statuses = ["Lead", "Pending", "Confirmed", "Completed"];
              const colors = ["bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-slate-400"];
              const bgColors = ["badge-blue", "badge-amber", "badge-emerald", "badge-slate"];
              const total = clients?.length || 1;
              return statuses.map((status, i) => {
                const count = clients?.filter((c: any) => c.status === status).length || 0;
                const pct = Math.round((count / total) * 100);
                const revenue = clients?.filter((c: any) => c.status === status).reduce((s: number, c: any) => s + Number(c.budget || 0), 0) || 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors[i]}`} />
                        <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">${(revenue / 1000).toFixed(0)}k</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md chip ${bgColors[i]}`}>{count}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors[i]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
              <button
                onClick={() => navigate("/analytics")}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Full analytics <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
