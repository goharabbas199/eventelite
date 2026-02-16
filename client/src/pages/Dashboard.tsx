import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { Users, Store, MapPin, Calendar, TrendingUp } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: clients, isLoading: loadingClients } = useClients();
  const { data: vendors, isLoading: loadingVendors } = useVendors();
  const { data: venues, isLoading: loadingVenues } = useVenues();

  const activeLeads = clients?.filter(c => c.status === "Lead" || c.status === "Confirmed").length || 0;
  
  // Mock data for chart
  const data = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
  ];

  if (loadingClients || loadingVendors || loadingVenues) {
    return (
      <Layout title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full mt-8 rounded-xl" />
      </Layout>
    );
  }

  return (
    <Layout title="Overview">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Vendors" 
          value={vendors?.length || 0} 
          icon={Store} 
          color="blue"
          trend="12%" 
        />
        <StatsCard 
          title="Available Venues" 
          value={venues?.length || 0} 
          icon={MapPin} 
          color="purple"
          trend="5%" 
        />
        <StatsCard 
          title="Active Clients" 
          value={activeLeads} 
          icon={Users} 
          color="green"
          trend="8%" 
        />
        <StatsCard 
          title="Upcoming Events" 
          value={clients?.filter(c => new Date(c.eventDate) > new Date()).length || 0} 
          icon={Calendar} 
          color="orange"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Revenue Overview</span>
                <div className="flex items-center text-sm font-normal text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
                  +12.5% vs last month
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 12}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b', fontSize: 12}}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md h-full">
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {clients?.slice(0, 5).map(client => (
                  <div key={client.id} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.eventType}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium 
                      ${client.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                        client.status === 'Lead' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}
                    `}>
                      {client.status}
                    </span>
                  </div>
                ))}
                {(!clients || clients.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">No recent clients</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
