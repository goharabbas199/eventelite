import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import {
  Users, Store, MapPin, DollarSign, TrendingUp, Wallet,
  Calendar, ChevronRight, Clock, ArrowUpRight,
} from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { buildUrl, api } from "@shared/routes";
import { format, differenceInDays } from "date-fns";

const priorityConfig = (d: number) => {
  if (d < 0)   return { label: "Past",   cls: "bg-slate-100 text-slate-500" };
  if (d <= 3)  return { label: "Urgent", cls: "bg-red-50 text-red-600" };
  if (d <= 14) return { label: "Soon",   cls: "bg-amber-50 text-amber-600" };
  return               { label: "Upcoming", cls: "bg-emerald-50 text-emerald-600" };
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-3.5 py-2.5">
      <p className="text-[11px] text-slate-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-bold text-indigo-600">${Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

export default function Dashboard() {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: vendors, isLoading: loadingVendors } = useVendors();
  const { data: venues, isLoading: loadingVenues } = useVenues();
  const [, navigate] = useLocation();
  const [range, setRange] = useState<"month" | "6months" | "year">("year");
  const [totalExpenses, setTotalExpenses] = useState(0);

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

  const netProfit = totalRevenue - totalExpenses;
  const activeClients = clients?.filter((c: any) => c.status === "Lead" || c.status === "Confirmed").length ?? 0;

  const upcomingEvents = useMemo(() => {
    if (!clients) return [];
    return clients
      .filter((c: any) => new Date(c.eventDate) > new Date())
      .sort((a: any, b: any) => +new Date(a.eventDate) - +new Date(b.eventDate))
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

  if (loadingClients || loadingVendors || loadingVenues) {
    return (
      <Layout title="Dashboard">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl mt-5" />
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
          <h2 className="text-xl font-bold text-slate-900">Welcome back, Alex 👋</h2>
        </div>
        <div className="hidden sm:flex flex-col items-end">
          <p className="eyebrow mb-1">Pipeline value</p>
          <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Stats grid — 3 + 3 ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatsCard title="Active Clients"  value={activeClients}                           icon={Users}      color="blue"   subtitle="Leads & confirmed" onClick={() => navigate("/clients")} />
        <StatsCard title="Total Vendors"   value={vendors?.length ?? 0}                   icon={Store}      color="purple" subtitle="Service providers"  onClick={() => navigate("/vendors")} />
        <StatsCard title="Venues"          value={venues?.length ?? 0}                    icon={MapPin}     color="orange" subtitle="Event locations"    onClick={() => navigate("/venues")} />
        <StatsCard title="Total Revenue"   value={`$${totalRevenue.toLocaleString()}`}    icon={DollarSign} color="green"  subtitle="All budgets" />
        <StatsCard title="Total Expenses"  value={`$${totalExpenses.toLocaleString()}`}   icon={Wallet}     color="orange" subtitle="Services + misc." />
        <StatsCard title="Net Profit"      value={`$${netProfit.toLocaleString()}`}       icon={TrendingUp} color={netProfit >= 0 ? "green" : "red"} subtitle={netProfit >= 0 ? "Profitable" : "Loss"} />
      </div>

      {/* ── Chart + Upcoming Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border border-slate-100 rounded-2xl shadow-sm bg-white">
          <CardHeader className="flex flex-row items-start justify-between pb-0 pt-4 px-5">
            <div>
              <CardTitle className="text-[14px] font-bold text-slate-900">Revenue Overview</CardTitle>
              <p className="text-[11px] text-slate-400 mt-0.5">Client budgets over time</p>
            </div>
            <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-0.5 gap-0.5">
              {(["month", "6months", "year"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    range === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {r === "month" ? "1M" : r === "6months" ? "6M" : "1Y"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-4 pb-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2}
                    fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-0 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[14px] font-bold text-slate-900">Upcoming Events</CardTitle>
                <p className="text-[11px] text-slate-400 mt-0.5">{upcomingEvents.length} scheduled</p>
              </div>
              <Calendar className="w-4 h-4 text-slate-300" />
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-3 pb-3">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[12px] text-slate-400 font-medium">No upcoming events</p>
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
                      className="flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-100 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{event.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-300" />
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
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  View all clients <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
