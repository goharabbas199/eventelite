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

export default function Dashboard() {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: vendors, isLoading: loadingVendors } = useVendors();
  const { data: venues, isLoading: loadingVenues } = useVenues();
  const [, navigate] = useLocation();

  const [range, setRange] = useState<"month" | "6months" | "year">("year");
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Revenue
  const totalRevenue = useMemo(() => {
    if (!clients) return 0;
    return clients.reduce(
      (sum: number, c: any) => sum + Number(c.budget || 0),
      0,
    );
  }, [clients]);

  // Expenses
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

          const planned =
            fullClient.services?.reduce(
              (sum: number, s: any) => sum + Number(s.cost || 0),
              0,
            ) || 0;

          const expenses =
            fullClient.expenses?.reduce(
              (sum: number, e: any) => sum + Number(e.cost || 0),
              0,
            ) || 0;

          total += planned + expenses;
        }),
      );

      setTotalExpenses(total);
    }

    calculateExpenses();
  }, [clients]);

  const netProfit = totalRevenue - totalExpenses;

  const activeClients =
    clients?.filter((c: any) => c.status === "Lead" || c.status === "Confirmed")
      .length || 0;

  const upcomingEventsList = useMemo(() => {
    if (!clients) return [];

    return clients
      .filter((c: any) => new Date(c.eventDate) > new Date())
      .sort(
        (a: any, b: any) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      )
      .slice(0, 5);
  }, [clients]);

  const revenueData = useMemo(() => {
    if (!clients) return [];

    const now = new Date();
    const months: Record<string, number> = {};

    clients.forEach((client: any) => {
      const date = new Date(client.eventDate);
      const diffMonths =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());

      if (
        (range === "month" && diffMonths <= 1) ||
        (range === "6months" && diffMonths <= 6) ||
        range === "year"
      ) {
        const key = date.toLocaleString("default", { month: "short" });
        months[key] = (months[key] || 0) + Number(client.budget || 0);
      }
    });

    return Object.entries(months).map(([name, revenue]) => ({
      name,
      revenue,
    }));
  }, [clients, range]);

  if (loadingClients || loadingVendors || loadingVenues) {
    return (
      <Layout title="Dashboard">
        <Skeleton className="h-32 w-full" />
      </Layout>
    );
  }

  return (
    <Layout title="Overview">
      <div className="bg-slate-50 min-h-screen p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Operations
        </h2>
        {/* OPERATIONAL ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
          <div
            onClick={() => navigate("/vendors")}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <StatsCard
              title="Total Vendors"
              value={vendors?.length || 0}
              icon={Store}
              color="purple"
            />
          </div>

          <div
            onClick={() => navigate("/venues")}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <StatsCard
              title="Total Venues"
              value={venues?.length || 0}
              icon={MapPin}
              color="blue"
            />
          </div>

          <div
            onClick={() => navigate("/clients")}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <StatsCard
              title="Active Clients"
              value={activeClients}
              icon={Users}
              color="green"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mt-10 mb-4">
          Financial Overview
        </h2>
        {/* FINANCIAL ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Total Expenses"
            value={`$${totalExpenses.toLocaleString()}`}
            icon={Wallet}
            color="orange"
          />
          <StatsCard
            title="Net Profit"
            value={`$${netProfit.toLocaleString()}`}
            icon={TrendingUp}
            color={netProfit >= 0 ? "green" : "red"}
          />
        </div>

        {/* CHART + UPCOMING SIDE BY SIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          {/* Revenue Chart - 2/3 */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border rounded-2xl">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Revenue Overview</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={range === "month" ? "default" : "outline"}
                    onClick={() => setRange("month")}
                  >
                    Month
                  </Button>
                  <Button
                    size="sm"
                    variant={range === "6months" ? "default" : "outline"}
                    onClick={() => setRange("6months")}
                  >
                    6 Months
                  </Button>
                  <Button
                    size="sm"
                    variant={range === "year" ? "default" : "outline"}
                    onClick={() => setRange("year")}
                  >
                    Year
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(v: any) => `$${v}`} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#1d4ed8"
                        strokeWidth={3}
                        fillOpacity={0.2}
                        fill="#1d4ed8"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events - 1/3 */}
          <div>
            <Card className="shadow-md h-full">
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEventsList.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    No upcoming events
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEventsList.map((event: any) => (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/clients/${event.id}`)}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition"
                      >
                        <div>
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.eventType} •{" "}
                            {new Date(event.eventDate).toLocaleDateString()}
                          </p>
                        </div>

                        {(() => {
                          const eventDate = new Date(event.eventDate);
                          const today = new Date();
                          const diffTime =
                            eventDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(
                            diffTime / (1000 * 60 * 60 * 24),
                          );

                          let label = "Normal";
                          let className = "bg-slate-100 text-slate-700";

                          if (diffDays < 0) {
                            label = "Overdue";
                            className = "bg-gray-200 text-gray-800";
                          } else if (diffDays <= 3) {
                            label = "High";
                            className = "bg-red-100 text-red-700";
                          } else if (diffDays <= 14) {
                            label = "Medium";
                            className = "bg-yellow-100 text-yellow-800";
                          }

                          return (
                            <div className="text-right">
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${className}`}
                              >
                                {label}
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {diffDays < 0
                                  ? `${Math.abs(diffDays)} days ago`
                                  : `${diffDays} days left`}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
