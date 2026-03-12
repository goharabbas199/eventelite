import { Layout } from "@/components/Layout";
import { useClients } from "@/hooks/use-clients";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DollarSign, TrendingUp, Users, Activity } from "lucide-react";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

export default function Analytics() {
  const { data: clients = [], isLoading } = useClients();

  const { data: allClients = [] } = useQuery({
    queryKey: ["/api/clients/full"],
    queryFn: async () => {
      const list = await fetch("/api/clients").then((r) => r.json()) as any[];
      const detailed = await Promise.all(
        list.map((c: any) => fetch(`/api/clients/${c.id}`).then((r) => r.json()))
      );
      return detailed;
    },
    enabled: clients.length > 0,
  });

  const totalEvents = allClients.length;

  const totalRevenue = allClients.reduce(
    (s: number, c: any) => s + Number(c.budget || 0),
    0
  );

  const totalExpenses = allClients.reduce((s: number, c: any) => {
    const services = (c.services || []).reduce(
      (a: number, sv: any) => a + Number(sv.cost || 0),
      0
    );
    const expenses = (c.expenses || []).reduce(
      (a: number, ex: any) => a + Number(ex.cost || 0),
      0
    );
    return s + services + expenses;
  }, 0);

  const totalProfit = totalRevenue - totalExpenses;
  const avgProfit = totalEvents > 0 ? Math.round(totalProfit / totalEvents) : 0;

  // Event type breakdown (pie chart)
  const byType = allClients.reduce((acc: Record<string, number>, c: any) => {
    const t = c.eventType || "Other";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  // Monthly revenue (bar chart) — group by event month
  const byMonth = allClients.reduce((acc: Record<string, number>, c: any) => {
    if (!c.eventDate) return acc;
    const key = new Date(c.eventDate).toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
    acc[key] = (acc[key] || 0) + Number(c.budget || 0);
    return acc;
  }, {});
  const barData = Object.entries(byMonth)
    .map(([month, revenue]) => ({ month, revenue }))
    .slice(-8);

  // Revenue vs Expenses bar
  const revExpData = allClients.map((c: any) => {
    const expenses =
      (c.services || []).reduce((a: number, sv: any) => a + Number(sv.cost || 0), 0) +
      (c.expenses || []).reduce((a: number, ex: any) => a + Number(ex.cost || 0), 0);
    return {
      name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
      Revenue: Number(c.budget || 0),
      Expenses: expenses,
      Profit: Number(c.budget || 0) - expenses,
    };
  });

  // Status breakdown
  const byStatus = allClients.reduce((acc: Record<string, number>, c: any) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Layout title="Analytics">
      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        <Card className="px-5 py-4 border border-border/50 rounded-xl bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              Total Events
            </p>
          </div>
          <p className="text-3xl font-semibold">{totalEvents}</p>
        </Card>

        <Card className="px-5 py-4 border border-border/50 rounded-xl bg-card">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              Total Revenue
            </p>
          </div>
          <p className="text-3xl font-semibold text-blue-600">{fmtMoney(totalRevenue)}</p>
        </Card>

        <Card className="px-5 py-4 border border-border/50 rounded-xl bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              Total Expenses
            </p>
          </div>
          <p className="text-3xl font-semibold text-amber-600">{fmtMoney(totalExpenses)}</p>
        </Card>

        <Card className="px-5 py-4 border border-border/50 rounded-xl bg-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              Total Profit
            </p>
          </div>
          <p className={`text-3xl font-semibold ${totalProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {fmtMoney(totalProfit)}
          </p>
        </Card>
      </div>

      {/* AVG PROFIT BANNER */}
      <div className="mt-4 px-5 py-3 rounded-xl border border-border/50 bg-card flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Average Profit per Event</span>
        <span className={`text-xl font-bold ${avgProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {fmtMoney(avgProfit)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Revenue by Month */}
        <Card className="border border-border/50 rounded-2xl bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue by Event Month</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => fmtMoney(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmtMoney(Number(v))} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Event Type Breakdown */}
        <Card className="border border-border/50 rounded-2xl bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Events by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue vs Expenses per Client */}
        {revExpData.length > 0 && (
          <Card className="border border-border/50 rounded-2xl bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Revenue vs Expenses per Client</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revExpData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => fmtMoney(v)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmtMoney(Number(v))} />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status breakdown */}
        {Object.keys(byStatus).length > 0 && (
          <Card className="border border-border/50 rounded-2xl bg-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Events by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(byStatus).map(([status, count], i) => (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground flex-1">{status}</span>
                    <span className="text-sm font-semibold">{count as number}</span>
                    <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
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
      </div>
    </Layout>
  );
}
