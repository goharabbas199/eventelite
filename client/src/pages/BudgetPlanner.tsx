import { Layout } from "@/components/Layout";
import { useClients, useCreateExpense, useUpdateExpense } from "@/hooks/use-clients";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type InsertExpense } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function BudgetPlanner() {
  const { data: clients, isLoading } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // When clients load, select the first one if none selected
  if (clients && clients.length > 0 && !selectedClientId) {
    setSelectedClientId(String(clients[0].id));
  }

  const selectedClient = clients?.find(c => String(c.id) === selectedClientId);
  
  // Need to fetch full client details to get expenses. 
  // In a real app we'd fetch expenses for selected client separately or rely on cache if we visited ClientDetails.
  // For now, let's assume useClients list doesn't have expenses, so we might need a separate hook or fetch.
  // BUT the schema says get client returns expenses. Let's use useClient hook for details.
  
  return (
    <Layout title="Budget Planner">
      <div className="mb-8">
        <div className="max-w-xs">
          <label className="text-sm font-medium text-slate-500 mb-2 block">Select Client Event</label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="bg-white border-slate-200 shadow-sm">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? <SelectItem value="loading">Loading...</SelectItem> : 
               clients?.map(c => (
                 <SelectItem key={c.id} value={String(c.id)}>{c.name} - {c.eventType}</SelectItem>
               ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClient && selectedClientId ? (
        <ClientBudgetView clientId={Number(selectedClientId)} initialBudget={Number(selectedClient.budget)} />
      ) : (
        <div className="text-center py-20 text-slate-400">Please select a client to view budget.</div>
      )}
    </Layout>
  );
}

// Sub-component to isolate hook calls per client
import { useClient } from "@/hooks/use-clients";

function ClientBudgetView({ clientId, initialBudget }: { clientId: number, initialBudget: number }) {
  const { data: client, isLoading } = useClient(clientId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  if (isLoading || !client) return <div>Loading budget data...</div>;

  const expenses = client.expenses || [];
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.cost), 0);
  const remaining = initialBudget - totalSpent;

  // Chart Data
  const data = expenses.map(e => ({ name: e.category, value: Number(e.cost) }));
  // Aggregate by category
  const aggregatedData = Object.values(expenses.reduce((acc: any, curr) => {
    if (!acc[curr.category]) acc[curr.category] = { name: curr.category, value: 0 };
    acc[curr.category].value += Number(curr.cost);
    return acc;
  }, {}));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Summary Cards */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 font-medium">Total Budget</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">${initialBudget.toLocaleString()}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 font-medium">Total Spent</p>
            <h3 className="text-3xl font-bold text-blue-600 mt-2">${totalSpent.toLocaleString()}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 font-medium">Remaining</p>
            <h3 className={`text-3xl font-bold mt-2 ${remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              ${remaining.toLocaleString()}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <div className="lg:col-span-2">
        <Card className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <CardTitle>Expenses</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                <CreateExpenseForm clientId={clientId} onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Category</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No expenses recorded.</TableCell></TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium pl-6">{expense.category}</TableCell>
                      <TableCell>{expense.item}</TableCell>
                      <TableCell>${Number(expense.cost).toLocaleString()}</TableCell>
                      <TableCell>
                        <PaidToggle expense={expense} clientId={clientId} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="h-80 lg:h-auto">
        <Card className="border-none shadow-md h-full">
          <CardHeader><CardTitle>Spending Breakdown</CardTitle></CardHeader>
          <CardContent className="h-64">
            {aggregatedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aggregatedData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {aggregatedData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No data to display</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PaidToggle({ expense, clientId }: { expense: any, clientId: number }) {
  const { mutate } = useUpdateExpense();
  
  return (
    <div 
      className={`cursor-pointer inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${expense.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
      onClick={() => mutate({ id: expense.id, clientId, isPaid: !expense.isPaid })}
    >
      {expense.isPaid ? (
        <><Check className="w-3 h-3 mr-1" /> Paid</>
      ) : (
        <><X className="w-3 h-3 mr-1" /> Unpaid</>
      )}
    </div>
  );
}

function CreateExpenseForm({ clientId, onSuccess }: { clientId: number, onSuccess: () => void }) {
  const { mutate, isPending } = useCreateExpense();
  const form = useForm<Omit<InsertExpense, "clientId">>({
    resolver: zodResolver(insertExpenseSchema.omit({ clientId: true })),
    defaultValues: { category: "", item: "", cost: 0, isPaid: false },
  });

  function onSubmit(data: any) {
    mutate({ clientId, ...data }, { onSuccess: () => { form.reset(); onSuccess(); } });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="Catering" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="item" render={({ field }) => (
          <FormItem><FormLabel>Item Details</FormLabel><FormControl><Input placeholder="Buffet deposit" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="cost" render={({ field }) => (
          <FormItem><FormLabel>Cost ($)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={isPending} className="w-full mt-2">{isPending ? "Adding..." : "Add Expense"}</Button>
      </form>
    </Form>
  );
}
