import { Layout } from "@/components/Layout";
import {
  useClients,
  useClient,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/use-clients";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Plus,
  Check,
  X,
  Trash2,
  DollarSign,
  Wallet,
  TrendingUp,
  PieChart as PieIcon,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Wrench,
  Receipt,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type InsertExpense } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const CATEGORY_COLORS: Record<string, string> = {
  Venue:           "#4f46e5",
  Catering:        "#10b981",
  Photography:     "#f59e0b",
  Entertainment:   "#8b5cf6",
  Decoration:      "#ec4899",
  "Flowers & Floral": "#14b8a6",
  Transportation:  "#f97316",
  "AV / Tech":     "#06b6d4",
  Other:           "#94a3b8",
};

const EXPENSE_CATEGORIES = Object.keys(CATEGORY_COLORS);

const PALETTE = Object.values(CATEGORY_COLORS);

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(val: number, total: number) {
  if (!total) return 0;
  return Math.min(100, (val / total) * 100);
}

type Tab = "overview" | "services" | "expenses";

export default function BudgetPlanner() {
  const { data: clients = [], isLoading } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();

  if (clients.length > 0 && !selectedClientId) {
    setSelectedClientId(String(clients[0].id));
  }

  const selectedClient = clients.find((c) => String(c.id) === selectedClientId);

  // All-clients health summary
  const healthSummary = useMemo(() => {
    return clients.map((c) => {
      const budget = Number(c.budget) || 0;
      return { id: c.id, name: c.name, budget, eventType: c.eventType, status: c.status };
    });
  }, [clients]);

  return (
    <Layout title="Budget Planner">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Finance</p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Budget Planner</h2>
        </div>
        <div className="min-w-[240px]">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="h-9 rounded-xl text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" data-testid="select-budget-client">
              <SelectValue placeholder="Select a client…" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading">Loading…</SelectItem>
              ) : (
                clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} — {c.eventType}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* All-clients health bar */}
      {healthSummary.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {healthSummary.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClientId(String(c.id))}
              data-testid={`client-health-${c.id}`}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                String(c.id) === selectedClientId
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                c.status === "Confirmed" ? "bg-emerald-500" :
                c.status === "Lead" ? "bg-amber-400" : "bg-slate-300"
              }`} />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{c.name.split(" ").slice(0, 2).join(" ")}</p>
                <p className="text-[10px] text-slate-400">{fmt(c.budget)}</p>
              </div>
              {String(c.id) === selectedClientId && (
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400 ml-1" />
              )}
            </button>
          ))}
        </div>
      )}

      {selectedClient && selectedClientId ? (
        <ClientBudgetView
          clientId={Number(selectedClientId)}
          initialBudget={Number(selectedClient.budget)}
          clientName={selectedClient.name}
          eventType={selectedClient.eventType}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <PieIcon className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Select a client to view their budget</p>
          <p className="text-xs text-slate-400">All spending, services and expenses in one view</p>
        </div>
      )}
    </Layout>
  );
}

function ClientBudgetView({
  clientId,
  initialBudget,
  clientName,
  eventType,
}: {
  clientId: number;
  initialBudget: number;
  clientName: string;
  eventType: string;
}) {
  const { data: client, isLoading } = useClient(clientId);
  const deleteExpense = useDeleteExpense();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (isLoading || !client) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-700" />
        ))}
      </div>
    );
  }

  const expenses = client.expenses || [];
  const services = client.services || [];
  const payments = client.payments || [];

  const servicesTotal = services.reduce((s, sv) => s + Number(sv.cost), 0);
  const expensesTotal = expenses.reduce((s, e) => s + Number(e.cost), 0);
  const paidExpenses = expenses.filter((e) => e.isPaid).reduce((s, e) => s + Number(e.cost), 0);
  const unpaidExpenses = expensesTotal - paidExpenses;
  const totalCommitted = servicesTotal + expensesTotal;
  const totalPaid = paidExpenses;
  const remaining = initialBudget - totalCommitted;
  const totalReceived = payments.reduce((s, p) => s + Number(p.amount), 0);
  const spendPercent = pct(totalCommitted, initialBudget);
  const isOverBudget = totalCommitted > initialBudget && initialBudget > 0;
  const isNearBudget = !isOverBudget && spendPercent >= 80;

  // Category breakdown — merge services (infer category from name) + expenses
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.cost);
  });
  services.forEach((sv) => {
    // Try to match service name to a known category
    const matched = EXPENSE_CATEGORIES.find((cat) =>
      sv.serviceName.toLowerCase().includes(cat.toLowerCase().split(" ")[0])
    ) || "Other";
    categoryMap[matched] = (categoryMap[matched] || 0) + Number(sv.cost);
  });

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const handleDelete = (id: number) => {
    deleteExpense.mutate({ id, clientId });
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "services", label: "Services", count: services.length },
    { id: "expenses", label: "Expenses", count: expenses.length },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Total Budget</p>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{fmt(initialBudget)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{eventType}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Committed</p>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{fmt(totalCommitted)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {services.length} service{services.length !== 1 ? "s" : ""} + {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Paid Out</p>
            <div className="p-2 rounded-xl bg-emerald-50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalPaid)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{fmt(unpaidExpenses)} unpaid</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {remaining >= 0 ? "Remaining" : "Over Budget"}
            </p>
            <div className={`p-2 rounded-xl ${isOverBudget ? "bg-red-50" : isNearBudget ? "bg-amber-50" : "bg-emerald-50"}`}>
              {isOverBudget
                ? <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                : <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              }
            </div>
          </div>
          <p className={`text-2xl font-bold ${isOverBudget ? "text-red-600" : "text-emerald-600"}`}>
            {fmt(Math.abs(remaining))}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{fmt(totalReceived)} received from client</p>
        </div>
      </div>

      {/* Budget progress bar */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{clientName}</p>
            {isOverBudget && (
              <Badge className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0 border-0">Over Budget</Badge>
            )}
            {isNearBudget && !isOverBudget && (
              <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 border-0">Near Limit</Badge>
            )}
          </div>
          <p className={`text-sm font-bold ${isOverBudget ? "text-red-600" : isNearBudget ? "text-amber-600" : "text-slate-700"}`}>
            {spendPercent.toFixed(1)}% used
          </p>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOverBudget ? "bg-red-500" : isNearBudget ? "bg-amber-400" : "bg-indigo-500"
            }`}
            style={{ width: `${Math.min(100, spendPercent)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-400">$0</span>
          <span className="text-[10px] text-slate-400">{fmt(initialBudget)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-budget-${tab.id}`}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Category breakdown chart */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80 h-full">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Spending Breakdown by Category</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Services + expenses combined</p>
              </CardHeader>
              <CardContent className="pt-4">
                {categoryData.length > 0 ? (
                  <div className="space-y-3">
                    {categoryData.map((item, i) => {
                      const color = CATEGORY_COLORS[item.name] || PALETTE[i % PALETTE.length];
                      const share = pct(item.value, totalCommitted);
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">{share.toFixed(0)}%</span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{fmt(item.value)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${share}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Layers className="w-8 h-8 text-slate-200" />
                    <p className="text-xs text-slate-400">No data yet — add services or expenses</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pie chart */}
          <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Budget Split</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((item, i) => (
                          <Cell
                            key={i}
                            fill={CATEGORY_COLORS[item.name] || PALETTE[i % PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {categoryData.slice(0, 5).map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[item.name] || PALETTE[i % PALETTE.length] }}
                        />
                        <span className="text-[11px] text-slate-500 flex-1 truncate">{item.name}</span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{fmt(item.value)}</span>
                      </div>
                    ))}
                    {categoryData.length > 5 && (
                      <p className="text-[10px] text-slate-400 pt-1">+ {categoryData.length - 5} more categories</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <PieIcon className="w-8 h-8 text-slate-200" />
                  <p className="text-xs text-slate-400">No data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "services" && (
        <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Planned Services</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">{services.length} service{services.length !== 1 ? "s" : ""} · {fmt(servicesTotal)} total</p>
            </div>
            <Wrench className="w-4 h-4 text-slate-300" />
          </CardHeader>
          <CardContent className="p-0">
            {services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <Wrench className="w-8 h-8 text-slate-200" />
                <p className="text-sm text-slate-400 font-medium">No services planned yet</p>
                <p className="text-xs text-slate-300">Create a quote and convert it to an event to add services</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {services.map((sv) => {
                  const matched = EXPENSE_CATEGORIES.find((cat) =>
                    sv.serviceName.toLowerCase().includes(cat.toLowerCase().split(" ")[0])
                  ) || "Other";
                  const color = CATEGORY_COLORS[matched] || "#94a3b8";
                  return (
                    <div key={sv.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors" data-testid={`service-row-${sv.id}`}>
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{sv.serviceName}</p>
                        <p className="text-[11px] text-slate-400">{matched}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <Badge className={`text-[10px] px-2 py-0 border-0 ${
                          sv.status === "Confirmed" ? "bg-emerald-100 text-emerald-700" :
                          sv.status === "Cancelled" ? "bg-red-100 text-red-600" :
                          "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        }`}>
                          {sv.status}
                        </Badge>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{fmt(Number(sv.cost))}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-700/30">
                  <span className="text-xs font-bold text-slate-600">Total Services</span>
                  <span className="text-sm font-bold text-indigo-600">{fmt(servicesTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "expenses" && (
        <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">Expenses</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {expenses.length} item{expenses.length !== 1 ? "s" : ""} · {fmt(paidExpenses)} paid · {fmt(unpaidExpenses)} pending
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs" data-testid="button-add-expense">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <CreateExpenseForm clientId={clientId} onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <Receipt className="w-8 h-8 text-slate-200" />
                <p className="text-sm text-slate-400 font-medium">No expenses recorded yet</p>
                <p className="text-xs text-slate-300">Click "Add Expense" to track spending</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/40">
                {expenses.map((expense) => {
                  const color = CATEGORY_COLORS[expense.category] || "#94a3b8";
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group"
                      data-testid={`expense-row-${expense.id}`}
                    >
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{expense.item}</p>
                        <p className="text-[11px] text-slate-400">{expense.category}</p>
                      </div>
                      <div className="flex items-center gap-2.5 ml-3 shrink-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{fmt(Number(expense.cost))}</p>
                        <PaidToggle expense={expense} clientId={clientId} />
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50/80 dark:bg-slate-700/30">
                  <span className="text-xs font-bold text-slate-600">Total Expenses</span>
                  <span className="text-sm font-bold text-indigo-600">{fmt(expensesTotal)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PaidToggle({ expense, clientId }: { expense: any; clientId: number }) {
  const { mutate } = useUpdateExpense();
  return (
    <button
      onClick={() => mutate({ id: expense.id, clientId, isPaid: !expense.isPaid })}
      data-testid={`toggle-paid-${expense.id}`}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
        expense.isPaid
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/60"
          : "bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-200 dark:hover:border-amber-900/50"
      }`}
    >
      {expense.isPaid
        ? <><Check className="w-2.5 h-2.5" /> Paid</>
        : <><X className="w-2.5 h-2.5" /> Unpaid</>
      }
    </button>
  );
}

const EXPENSE_CATEGORY_OPTIONS = [
  "Venue", "Catering", "Photography", "Entertainment",
  "Decoration", "Flowers & Floral", "Transportation", "AV / Tech", "Other",
];

function CreateExpenseForm({ clientId, onSuccess }: { clientId: number; onSuccess: () => void }) {
  const { mutate, isPending } = useCreateExpense();
  const form = useForm<Omit<InsertExpense, "clientId">>({
    resolver: zodResolver(insertExpenseSchema.omit({ clientId: true })),
    defaultValues: { category: "", item: "", cost: 0, isPaid: false },
  });

  function onSubmit(data: any) {
    mutate({ clientId, ...data }, { onSuccess: () => { form.reset(); onSuccess(); } });
  }

  const inputCls = "h-9 rounded-xl text-sm border-slate-200";
  const labelCls = "text-xs font-semibold text-slate-600";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={inputCls} data-testid="select-expense-category">
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENSE_CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Item Description</FormLabel>
              <FormControl>
                <Input className={inputCls} placeholder="e.g. Ballroom deposit" data-testid="input-expense-item" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Amount ($)</FormLabel>
              <FormControl>
                <Input
                  className={inputCls}
                  type="number"
                  placeholder="0"
                  data-testid="input-expense-cost"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isPaid"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  data-testid="toggle-expense-ispaid"
                  className={`w-10 h-5 rounded-full transition-all relative ${field.value ? "bg-emerald-500" : "bg-slate-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow transition-all ${field.value ? "left-5" : "left-0.5"}`} />
                </button>
                <FormLabel className={labelCls}>Mark as paid</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700"
          data-testid="button-submit-expense"
        >
          {isPending ? "Adding…" : "Add Expense"}
        </Button>
      </form>
    </Form>
  );
}
