import { Layout } from "@/components/Layout";
import {
  useClients,
  useClient,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/use-clients";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Check, X, Trash2, DollarSign, Wallet, TrendingUp, PieChart as PieIcon } from "lucide-react";
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

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function BudgetPlanner() {
  const { data: clients, isLoading } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();

  if (clients && clients.length > 0 && !selectedClientId) {
    setSelectedClientId(String(clients[0].id));
  }

  const selectedClient = clients?.find((c) => String(c.id) === selectedClientId);

  return (
    <Layout title="Budget Planner">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Finance</p>
          <h2 className="text-xl font-bold text-slate-900">Budget Planner</h2>
        </div>

        <div className="min-w-[220px]">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="h-9 rounded-xl text-sm border-border/60 bg-white">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading">Loading...</SelectItem>
              ) : (
                clients?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} — {c.eventType}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClient && selectedClientId ? (
        <ClientBudgetView
          clientId={Number(selectedClientId)}
          initialBudget={Number(selectedClient.budget)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-border/40 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <PieIcon className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Select a client to view budget</p>
        </div>
      )}
    </Layout>
  );
}

function ClientBudgetView({ clientId, initialBudget }: { clientId: number; initialBudget: number }) {
  const { data: client, isLoading } = useClient(clientId);
  const deleteExpense = useDeleteExpense();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading || !client) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-border/40" />)}
      </div>
    );
  }

  const expenses = client.expenses || [];
  const plannedServices = client.services || [];
  const servicesTotal = plannedServices.reduce((s, sv) => s + Number(sv.cost), 0);
  const manualExpensesTotal = expenses.reduce((s, e) => s + Number(e.cost), 0);
  const totalSpent = servicesTotal + manualExpensesTotal;
  const remaining = initialBudget - totalSpent;
  const spendPercent = initialBudget > 0 ? Math.min(100, (totalSpent / initialBudget) * 100) : 0;

  const aggregatedData = Object.values(
    expenses.reduce((acc: any, curr) => {
      if (!acc[curr.category]) acc[curr.category] = { name: curr.category, value: 0 };
      acc[curr.category].value += Number(curr.cost);
      return acc;
    }, {}),
  ) as { name: string; value: number }[];

  const handleDelete = (id: number) => {
    deleteExpense.mutate({ id, clientId });
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Budget",   value: `$${initialBudget.toLocaleString()}`,  icon: DollarSign, cls: "text-slate-800",   bg: "bg-slate-100" },
          { label: "Total Spent",    value: `$${totalSpent.toLocaleString()}`,      icon: Wallet,     cls: "text-indigo-600",  bg: "bg-indigo-50" },
          { label: "Remaining",      value: `$${remaining.toLocaleString()}`,       icon: TrendingUp, cls: remaining < 0 ? "text-red-600" : "text-emerald-600", bg: remaining < 0 ? "bg-red-50" : "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, cls, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
              <div className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`w-3.5 h-3.5 ${cls}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-border/60 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600">Budget Used</p>
          <p className={`text-xs font-bold ${spendPercent >= 90 ? "text-red-600" : "text-slate-700"}`}>{spendPercent.toFixed(1)}%</p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${spendPercent >= 100 ? "bg-red-500" : spendPercent >= 80 ? "bg-amber-500" : "bg-indigo-500"}`}
            style={{ width: `${spendPercent}%` }}
          />
        </div>
      </div>

      {/* Expenses + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Expense list */}
        <div className="lg:col-span-2">
          <Card className="border border-border/60 rounded-2xl shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Expenses</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">{expenses.length} items recorded</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs">
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
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Wallet className="w-8 h-8 text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">No expenses recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{expense.item}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{expense.category}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <p className="text-sm font-bold text-slate-800">${Number(expense.cost).toLocaleString()}</p>
                        <PaidToggle expense={expense} clientId={clientId} />
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pie chart */}
        <Card className="border border-border/60 rounded-2xl shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {aggregatedData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={aggregatedData} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {aggregatedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {aggregatedData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-500 flex-1 truncate">{item.name}</span>
                      <span className="text-xs font-bold text-slate-700">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <PieIcon className="w-8 h-8 text-slate-300" />
                <p className="text-xs text-slate-400">No data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PaidToggle({ expense, clientId }: { expense: any; clientId: number }) {
  const { mutate } = useUpdateExpense();
  return (
    <button
      onClick={() => mutate({ id: expense.id, clientId, isPaid: !expense.isPaid })}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
        expense.isPaid
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
      }`}
    >
      {expense.isPaid ? <><Check className="w-2.5 h-2.5" /> Paid</> : <><X className="w-2.5 h-2.5" /> Unpaid</>}
    </button>
  );
}

function CreateExpenseForm({ clientId, onSuccess }: { clientId: number; onSuccess: () => void }) {
  const { mutate, isPending } = useCreateExpense();
  const form = useForm<Omit<InsertExpense, "clientId">>({
    resolver: zodResolver(insertExpenseSchema.omit({ clientId: true })),
    defaultValues: { category: "", item: "", cost: 0, isPaid: false },
  });

  function onSubmit(data: any) {
    mutate({ clientId, ...data }, { onSuccess: () => { form.reset(); onSuccess(); } });
  }

  const inputCls = "h-9 rounded-xl text-sm border-border/60";
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
              <FormControl><Input className={inputCls} placeholder="e.g. Catering" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="item"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Item Details</FormLabel>
              <FormControl><Input className={inputCls} placeholder="e.g. Buffet deposit" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelCls}>Cost ($)</FormLabel>
              <FormControl>
                <Input className={inputCls} type="number" {...field} onChange={(e) => field.onChange(e.target.value)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700">
          {isPending ? "Adding..." : "Add Expense"}
        </Button>
      </form>
    </Form>
  );
}
