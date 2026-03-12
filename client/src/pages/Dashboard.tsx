import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import {
  Users,
  Store,
  MapPin,
  DollarSign,
  TrendingUp,
  Wallet,
  Calendar,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { buildUrl, api } from "@shared/routes";
import { format, differenceInDays } from "date-fns";

const priorityConfig = (daysLeft: number) => {
  if (daysLeft < 0)  return { label: "Past",   cls: "bg-slate-100 text-slate-600" };
  if (daysLeft <= 3) return { label: "Urgent", cls: "bg-red-100 text-red-700" };
  if (daysLeft <= 14) return { label: "Soon",  cls: "bg-amber-100 text-amber-700" };
  return                     { label: "Normal", cls: "bg-green-100 text-green-700" };
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border/60 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-slate-500 mb-1 font-medium">{label}</p>
        <p className="text-sm font-bold text-indigo-600">${Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: vendors, isLoading: loadingVendors } = useVendors();
  const { data: venues, isLoading: loadingVenues } = useVenues();
  const [, navigate] = useLocation();

  const [range, setRange] = useState<"month" | "6months" | "year">("year");
  const [totalExpenses, setTotalExpenses] = useState(0);

  const totalRevenue = useMemo(() => {
    if (!clients) return 0;
    return clients.reduce((sum: number, c: any) => sum + Number(c.budget || 0), 0);
  }, [clients]);

  useEffect(() => {
    if (!clients || clients.length === 0) return;
    async function calculateExpenses() {
      let total = 0;
      await Promise.all(
        clients.map(async (client: any) => {
          const url = buildUrl(api.clients.get.path, { id: client.id });
          const res = await fetch(url);
          if (!res.ok) return;
          const fullClient = await res.json();
          const planned = fullClient.services?.reduce((sum: number, s: any) => sum + Number(s.cost || 0), 0) || 0;
          const expenses = fullClient.expenses?.reduce((sum: number, e: any) => sum + Number(e.cost || 0), 0) || 0;
          total += planned + expenses;
        }),
      );
      setTotalExpenses(total);
    }
    calculateExpenses();
  }, [clients]);

  const netProfit = totalRevenue - totalExpenses;

  const activeClients = clients?.filter(
    (c: any) => c.status === "Lead" || c.status === "Confirmed",
  ).length || 0;

  const upcomingEventsList = useMemo(() => {
    if (!clients) return [];
    return clients
      .filter((c: any) => new Date(c.eventDate) > new Date())
      .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .slice(0, 5);
  }, [clients]);

  const revenueData = useMemo(() => {
    if (!clients) return [];
    const now = new Date();
    const months: Record<string, number> = {};
    clients.forEach((client: any) => {
      const date = new Date(client.eventDate);
      const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (
        (range === "month" && diffMonths <= 1) ||
        (range === "6months" && diffMonths <= 6) ||
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl mt-6" />
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 md:p-6 text-white shadow-lg shadow-indigo-900/20">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Good day 👋</p>
            <h2 className="text-xl md:text-2xl font-bold">Welcome back, Alex</h2>
            <p className="text-indigo-200 text-sm mt-1.5">
              {format(new Date(), "EEEE, MMMM do yyyy")}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <span className="text-indigo-200 text-xs font-medium">Pipeline</span>
            <span className="text-2xl font-bold">${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Operations Section */}
      <div>
        <p className="section-label mb-3">Operations</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total Vendors"
            value={vendors?.length || 0}
            icon={Store}
            color="purple"
            subtitle="Service providers"
            onClick={() => navigate("/vendors")}
          />
          <StatsCard
            title="Total Venues"
            value={venues?.length || 0}
            icon={MapPin}
            color="blue"
            subtitle="Event locations"
            onClick={() => navigate("/venues")}
          />
          <StatsCard
            title="Active Clients"
            value={activeClients}
            icon={Users}
            color="green"
            subtitle="Leads & confirmed"
            onClick={() => navigate("/clients")}
          />
        </div>
      </div>

      {/* Financial Section */}
      <div>
        <p className="section-label mb-3">Financial Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            subtitle="All client budgets"
          />
          <StatsCard
            title="Total Expenses"
            value={`$${totalExpenses.toLocaleString()}`}
            icon={Wallet}
            color="orange"
            subtitle="Services + misc."
          />
          <StatsCard
            title="Net Profit"
            value={`$${netProfit.toLocaleString()}`}
            icon={TrendingUp}
            color={netProfit >= 0 ? "green" : "red"}
            subtitle={netProfit >= 0 ? "Profitable" : "Loss"}
          />
        </div>
      </div>

      {/* Chart + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border border-border/60 rounded-2xl shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Revenue Overview</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Client budgets over time</p>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
              {(["month", "6months", "year"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    range === r
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {r === "month" ? "1M" : r === "6months" ? "6M" : "1Y"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border border-border/60 rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Upcoming Events</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">{upcomingEventsList.length} events ahead</p>
              </div>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingEventsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-400 font-medium">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingEventsList.map((event: any) => {
                  const daysLeft = differenceInDays(new Date(event.eventDate), new Date());
                  const priority = priorityConfig(daysLeft);

                  return (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/clients/${event.id}`)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-150 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{event.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <p className="text-[11px] text-slate-400">{format(new Date(event.eventDate), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priority.cls}`}>
                          {priority.label}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() => navigate("/clients")}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View all clients <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
