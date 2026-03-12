import { Layout } from "@/components/Layout";
import { useClients } from "@/hooks/use-clients";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, Users, Activity,
  Download, Percent, Trophy, ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";

const PIE_COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-600 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 font-medium" style={{ color: p.fill }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
          {p.name}: {fmtMoney(Number(p.value))}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data: clients = [], isLoading } = useClients();

  const { data: allClients = [], isLoading: loadingFull } = useQuery({
    queryKey: ["/api/clients/full"],
    queryFn: async () => {
      const list = await fetch("/api/clients").then((r) => r.json()) as any[];
      return Promise.all(list.map((c: any) => fetch(`/api/clients/${c.id}`).then((r) => r.json())));
    },
    enabled: clients.length > 0,
  });

  const totalEvents  = allClients.length;
  const totalRevenue = allClients.reduce((s: number, c: any) => s + Number(c.budget || 0), 0);
  const totalExpenses = allClients.reduce((s: number, c: any) => {
    const svcs = (c.services || []).reduce((a: number, sv: any) => a + Number(sv.cost || 0), 0);
    const exps = (c.expenses || []).reduce((a: number, ex: any) => a + Number(ex.cost || 0), 0);
    return s + svcs + exps;
  }, 0);
  const totalProfit   = totalRevenue - totalExpenses;
  const avgProfit     = totalEvents > 0 ? Math.round(totalProfit / totalEvents) : 0;
  const profitMargin  = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const completedCount = allClients.filter((c: any) => c.status === "Completed").length;
  const winRate       = totalEvents > 0 ? Math.round((completedCount / totalEvents) * 100) : 0;

  const byType = allClients.reduce((acc: Record<string, number>, c: any) => {
    const t = c.eventType || "Other";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  const byMonth = allClients.reduce((acc: Record<string, number>, c: any) => {
    if (!c.eventDate) return acc;
    const key = new Date(c.eventDate).toLocaleString("default", { month: "short", year: "2-digit" });
    acc[key] = (acc[key] || 0) + Number(c.budget || 0);
    return acc;
  }, {});
  const barData = Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue })).slice(-8);

  const revExpData = allClients.map((c: any) => {
    const expenses =
      (c.services || []).reduce((a: number, sv: any) => a + Number(sv.cost || 0), 0) +
      (c.expenses || []).reduce((a: number, ex: any) => a + Number(ex.cost || 0), 0);
    return {
      name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
      Revenue:  Number(c.budget || 0),
      Expenses: expenses,
      Profit:   Number(c.budget || 0) - expenses,
    };
  });

  const byStatus = allClients.reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  // Top clients by revenue
  const topClients = [...allClients]
    .sort((a: any, b: any) => Number(b.budget || 0) - Number(a.budget || 0))
    .slice(0, 5);

  const handleExportCSV = () => {
    if (!allClients.length) return;
    const headers = ["Name", "Event Type", "Event Date", "Status", "Budget", "Expenses", "Profit", "Profit Margin"];
    const rows = allClients.map((c: any) => {
      const expenses =
        (c.services || []).reduce((a: number, sv: any) => a + Number(sv.cost || 0), 0) +
        (c.expenses || []).reduce((a: number, ex: any) => a + Number(ex.cost || 0), 0);
      const budget = Number(c.budget || 0);
      const profit = budget - expenses;
      const margin = budget > 0 ? `${Math.round((profit / budget) * 100)}%` : "0%";
      return [
        c.name,
        c.eventType || "",
        c.eventDate ? format(new Date(c.eventDate), "yyyy-MM-dd") : "",
        c.status || "",
        budget,
        expenses,
        profit,
        margin,
      ];
    });
    const csv = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `eventelite_analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = [
    { label: "Total Events",   value: String(totalEvents),      icon: Users,      color: "text-slate-800",  bg: "bg-slate-100" },
    { label: "Total Revenue",  value: fmtMoney(totalRevenue),   icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Expenses", value: fmtMoney(totalExpenses),  icon: Activity,   color: "text-amber-600",  bg: "bg-amber-50"  },
    { label: "Net Profit",     value: fmtMoney(totalProfit),    icon: TrendingUp, color: totalProfit >= 0 ? "text-emerald-600" : "text-red-500", bg: totalProfit >= 0 ? "bg-emerald-50" : "bg-red-50" },
  ];

  return (
    <Layout title="Analytics">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Insights</p>
          <h2 className="text-xl font-bold text-slate-900">Analytics Overview</h2>
          <p className="text-sm text-slate-400 mt-1">Performance across all {totalEvents} events</p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="h-9 rounded-xl text-xs font-semibold flex items-center gap-2 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
          disabled={allClients.length === 0}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Avg Profit / Event</p>
            <p className="text-xs text-slate-400 mt-0.5">Across all {totalEvents} events</p>
          </div>
          <span className={`text-2xl font-bold ${avgProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {fmtMoney(avgProfit)}
          </span>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Profit Margin</p>
            <p className="text-xs text-slate-400 mt-0.5">Revenue vs. total expenses</p>
          </div>
          <div className="flex items-center gap-1">
            <Percent className="w-4 h-4 text-indigo-400" />
            <span className={`text-2xl font-bold ${profitMargin >= 30 ? "text-emerald-600" : profitMargin >= 0 ? "text-amber-600" : "text-red-500"}`}>
              {profitMargin}%
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Completion Rate</p>
            <p className="text-xs text-slate-400 mt-0.5">{completedCount} events completed</p>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className={`text-2xl font-bold ${winRate >= 50 ? "text-emerald-600" : "text-amber-600"}`}>
              {winRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by Month */}
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">Revenue by Event Month</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <EmptyChart message="No revenue data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtMoney} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Events by Type */}
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">Events by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <EmptyChart message="No event data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue vs Expenses per Client */}
        {revExpData.length > 0 && (
          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">Revenue vs Expenses per Client</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revExpData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtMoney} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Revenue"  fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Profit"   fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status Breakdown + Top Clients side by side */}
        {Object.keys(byStatus).length > 0 && (
          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900">Pipeline by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(byStatus).map(([status, count], i) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-slate-600 flex-1 font-medium">{status}</span>
                    <span className="text-sm font-bold text-slate-800">{count as number}</span>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${((count as number / totalEvents) * 100).toFixed(0)}%`,
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Clients by Revenue */}
        {topClients.length > 0 && (
          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">Top Clients by Revenue</CardTitle>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topClients.map((c: any, i) => {
                  const budget = Number(c.budget || 0);
                  const max = Number(topClients[0]?.budget || 1);
                  const pct = Math.round((budget / max) * 100);
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 w-4 text-center">#{i + 1}</span>
                          <span className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{c.eventType}</span>
                          <span className="text-sm font-bold text-indigo-600">{fmtMoney(budget)}</span>
                          <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 flex-col gap-2">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
        <Activity className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}
