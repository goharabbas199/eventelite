import { Layout } from "@/components/Layout";
import {
  useClient,
  useCreatePlannedService,
  useUpdateClient,
  useDeletePlannedService,
  useUpdatePlannedService,
  useCreatePayment,
  useDeletePayment,
  useCreateVendorPayment,
  useUpdateVendorPayment,
  useDeleteVendorPayment,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTasks,
} from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Mail,
  Phone,
  Users,
  Trash2,
  Pencil,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Square,
  SquareCheck,
  ListChecks,
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
import {
  insertPlannedServiceSchema,
  type InsertPlannedService,
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ClientDetails() {
  const [, params] = useRoute("/clients/:id");
  const id = Number(params?.id);

  const { data: client, isLoading } = useClient(id);
  const { data: venues } = useVenues();
  const { data: vendors } = useVendors();
  const updateClient = useUpdateClient();
  const deleteService = useDeletePlannedService();
  const updateService = useUpdatePlannedService();
  const deletePayment = useDeletePayment();
  const updateVendorPayment = useUpdateVendorPayment();
  const deleteVendorPayment = useDeleteVendorPayment();

  const { data: taskList = [] } = useTasks(id);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isVendorPaymentDialogOpen, setIsVendorPaymentDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  if (isLoading)
    return (
      <Layout>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </Layout>
    );

  if (!client) return <Layout>Client not found</Layout>;

  const selectedVenue = venues?.find((v) => v.id === client.venueId);
  const venueCost = selectedVenue ? Number(selectedVenue.basePrice) : 0;
  const totalPlannedCost =
    client.services?.reduce((sum: number, s: any) => sum + Number(s.cost), 0) || 0;
  const totalManualExpenses =
    client.expenses?.reduce((sum: number, e: any) => sum + Number(e.cost), 0) || 0;
  const totalCost = venueCost + totalPlannedCost + totalManualExpenses;
  const budget = client.budget ? Number(client.budget) : 0;

  const totalPaid =
    client.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const remainingBalance = budget - totalPaid;

  const vendorPaymentsPending =
    client.vendorPayments
      ?.filter((vp: any) => vp.status === "Unpaid")
      .reduce((sum: number, vp: any) => sum + Number(vp.amount), 0) || 0;

  const profit = budget - totalCost;
  const profitPercentage = budget > 0 ? ((profit / budget) * 100).toFixed(1) : "0";

  const getVendorName = (vendorId: number) => {
    return vendors?.find((v) => v.id === vendorId)?.name || `Vendor #${vendorId}`;
  };

  return (
    <Layout title="Client Profile">
      {/* HEADER */}
      <div className="space-y-4">
        {/* Back nav + action */}
        <div className="flex items-center justify-between">
          <Link href="/clients" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
          </Link>
          <Link href="/clients">
            <Button variant="outline" className="h-8 rounded-xl text-xs">Done</Button>
          </Link>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl gradient-indigo flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-sm shadow-indigo-900/20">
                {client.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-slate-900 truncate">{client.name}</h1>
                  <span className={`chip ${client.status === "Confirmed" ? "bg-emerald-50 text-emerald-700" : client.status === "Completed" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                    {client.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(client.eventDate), "MMM d, yyyy")}</span>
                  {client.guestCount && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {client.guestCount} guests</span>}
                </div>
              </div>
            </div>

            {/* Venue selector */}
            <div className="shrink-0">
              <Select
                value={client.venueId ? String(client.venueId) : ""}
                onValueChange={(val) => updateClient.mutate({ id: client.id, venueId: val ? Number(val) : undefined })}
              >
                <SelectTrigger className="h-8 w-48 rounded-xl text-xs border-slate-200">
                  <SelectValue placeholder="Assign venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues?.map((venue) => (
                    <SelectItem key={venue.id} value={String(venue.id)}>{venue.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Budget",           value: `$${budget.toLocaleString()}`,             cls: "text-slate-800" },
          { label: "Total Expenses",   value: `$${totalCost.toLocaleString()}`,           cls: "text-amber-600" },
          { label: "Received",         value: `$${totalPaid.toLocaleString()}`,           cls: "text-emerald-600" },
          { label: "Balance Due",      value: `$${remainingBalance.toLocaleString()}`,    cls: remainingBalance > 0 ? "text-red-600" : "text-emerald-600" },
          { label: "Vendor Pending",   value: `$${vendorPaymentsPending.toLocaleString()}`, cls: "text-red-500" },
          { label: "Net Profit",       value: `$${profit.toLocaleString()}`,              cls: profit >= 0 ? "text-emerald-600" : "text-red-600" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="stat-card">
            <p className="eyebrow mb-1.5">{label}</p>
            <p className={`text-[18px] font-bold tracking-tight leading-none ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* FEATURE 1 — PLANNED SERVICES TABLE */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <CardTitle>Planned Services</CardTitle>
              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setEditingService(null)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
                  </DialogHeader>
                  <ServiceForm
                    clientId={id}
                    editingService={editingService}
                    onSuccess={() => {
                      setIsServiceDialogOpen(false);
                      setEditingService(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Service</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVenue && (
                    <TableRow className="bg-slate-50">
                      <TableCell className="font-semibold text-slate-700 pl-6">
                        Venue — {selectedVenue.name}
                      </TableCell>
                      <TableCell>${venueCost.toLocaleString()}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                  {client.services?.map((service: any) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-semibold text-slate-700 pl-6">
                        {service.serviceName}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        ${Number(service.cost).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {service.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setIsServiceDialogOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              deleteService.mutate({
                                clientId: client.id,
                                serviceId: service.id,
                              })
                            }
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {totalCost > 0 && (
                    <TableRow className="bg-blue-50 font-semibold border-t-2">
                      <TableCell className="pl-6">Total</TableCell>
                      <TableCell className="text-blue-800 text-lg">
                        ${totalCost.toLocaleString()}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* FEATURE 2 — CLIENT PAYMENT TRACKER */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <CardTitle>Client Payments</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Paid: <span className="font-semibold text-emerald-600">${totalPaid.toLocaleString()}</span>
                  {" · "}
                  Remaining: <span className={`font-semibold ${remainingBalance > 0 ? "text-red-500" : "text-emerald-600"}`}>${remainingBalance.toLocaleString()}</span>
                </p>
              </div>
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                  </DialogHeader>
                  <PaymentForm
                    clientId={id}
                    onSuccess={() => setIsPaymentDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {(!client.payments || client.payments.length === 0) ? (
                <p className="text-sm text-slate-400 text-center py-6">No payments recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="pl-6 text-slate-600">
                          {format(new Date(p.paymentDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          ${Number(p.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-slate-500">{p.paymentMethod}</TableCell>
                        <TableCell className="text-slate-500">{p.notes || "-"}</TableCell>
                        <TableCell className="text-right pr-6">
                          <button
                            onClick={() => deletePayment.mutate({ id: p.id, clientId: client.id })}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* FEATURE 3 — VENDOR PAYMENT TRACKER */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <CardTitle>Vendor Payments</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Pending: <span className="font-semibold text-red-500">${vendorPaymentsPending.toLocaleString()}</span>
                </p>
              </div>
              <Dialog open={isVendorPaymentDialogOpen} onOpenChange={setIsVendorPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Vendor Payment</DialogTitle>
                  </DialogHeader>
                  <VendorPaymentForm
                    clientId={id}
                    services={client.services || []}
                    vendors={vendors || []}
                    onSuccess={() => setIsVendorPaymentDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              {(!client.vendorPayments || client.vendorPayments.length === 0) ? (
                <p className="text-sm text-slate-400 text-center py-6">No vendor payments recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.vendorPayments.map((vp: any) => (
                      <TableRow key={vp.id}>
                        <TableCell className="pl-6 font-medium text-slate-700">
                          {getVendorName(vp.vendorId)}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          ${Number(vp.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={vp.status === "Paid" ? "default" : "secondary"}
                            className={vp.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}
                          >
                            {vp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          {vp.paymentDate ? format(new Date(vp.paymentDate), "MMM dd, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            {vp.status === "Unpaid" && (
                              <button
                                onClick={() =>
                                  updateVendorPayment.mutate({
                                    id: vp.id,
                                    clientId: client.id,
                                    status: "Paid",
                                    paymentDate: new Date().toISOString(),
                                  })
                                }
                                className="text-emerald-500 hover:text-emerald-700 transition"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                deleteVendorPayment.mutate({ id: vp.id, clientId: client.id })
                              }
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {/* FEATURE 4 — TASK CHECKLIST */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-slate-500" />
                  <CardTitle>Event Checklist</CardTitle>
                  <span className="text-xs text-slate-400 ml-1">
                    {taskList.filter((t) => t.status === "Completed").length}/{taskList.length} done
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add a task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTaskTitle.trim()) {
                      createTask.mutate({
                        clientId: id,
                        title: newTaskTitle.trim(),
                        dueDate: newTaskDueDate || undefined,
                      });
                      setNewTaskTitle("");
                      setNewTaskDueDate("");
                    }
                  }}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-36"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!newTaskTitle.trim() || createTask.isPending}
                  onClick={() => {
                    if (!newTaskTitle.trim()) return;
                    createTask.mutate({
                      clientId: id,
                      title: newTaskTitle.trim(),
                      dueDate: newTaskDueDate || undefined,
                    });
                    setNewTaskTitle("");
                    setNewTaskDueDate("");
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {taskList.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No tasks yet. Add one above.</p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {taskList.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group">
                      <button
                        onClick={() =>
                          updateTask.mutate({
                            id: task.id,
                            clientId: id,
                            status: task.status === "Completed" ? "Pending" : "Completed",
                          })
                        }
                        className="shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        {task.status === "Completed" ? (
                          <SquareCheck className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${task.status === "Completed" ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">
                              Due {format(new Date(task.dueDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask.mutate({ id: task.id, clientId: id })}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN — Budget Overview + Profit Simulator */}
        <div className="flex flex-col gap-4">
          <Card className="border border-slate-100 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase text-slate-400 mb-2">Revenue</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Client Budget</span>
                    <span className="font-bold text-lg text-slate-900">
                      ${budget.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs uppercase text-slate-400 mb-2">Expenses</p>
                  {selectedVenue && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Venue</span>
                      <span>${venueCost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Services</span>
                    <span>${totalPlannedCost.toLocaleString()}</span>
                  </div>
                  {totalManualExpenses > 0 && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Extra Expenses</span>
                      <span>${totalManualExpenses.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total Expenses</span>
                    <span>${totalCost.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs uppercase text-slate-400 mb-2">Profit</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Gross Profit</span>
                    <div className="text-right">
                      <span
                        className={`font-bold text-lg ${
                          profit < 0 ? "text-red-500" : "text-emerald-600"
                        }`}
                      >
                        ${profit.toLocaleString()}
                      </span>
                      <div className="text-xs text-slate-400">{profitPercentage}% margin</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs uppercase text-slate-400 mb-2">Payment Status</p>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Total Paid</span>
                    <span className="text-emerald-600 font-medium">${totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Balance Due</span>
                    <span className={`font-medium ${remainingBalance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      ${remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PROFIT SIMULATOR */}
          <ProfitSimulator totalCost={totalCost} />
        </div>
      </div>
    </Layout>
  );
}

/* ---------- SERVICE FORM (Create + Edit) ---------- */
function ServiceForm({
  clientId,
  editingService,
  onSuccess,
}: {
  clientId: number;
  editingService: any | null;
  onSuccess: () => void;
}) {
  const { mutate: create, isPending: isCreating } = useCreatePlannedService();
  const { mutate: update, isPending: isUpdating } = useUpdatePlannedService();
  const { data: vendors } = useVendors();

  const form = useForm<Omit<InsertPlannedService, "clientId">>({
    resolver: zodResolver(insertPlannedServiceSchema.omit({ clientId: true })),
    defaultValues: {
      serviceName: editingService?.serviceName || "",
      cost: editingService?.cost ? Number(editingService.cost) : 0,
      vendorId: editingService?.vendorId || undefined,
      notes: editingService?.notes || "",
    },
  });

  function onSubmit(data: any) {
    if (editingService) {
      update(
        {
          serviceId: editingService.id,
          clientId,
          ...data,
          cost: Number(data.cost),
        },
        { onSuccess: () => { form.reset(); onSuccess(); } }
      );
    } else {
      create(
        { clientId, ...data },
        { onSuccess: () => { form.reset(); onSuccess(); } }
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="serviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="Catering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor (Optional)</FormLabel>
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vendors?.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isCreating || isUpdating} className="w-full mt-2">
          {isCreating || isUpdating
            ? editingService ? "Saving..." : "Adding..."
            : editingService ? "Save Changes" : "Add Service"}
        </Button>
      </form>
    </Form>
  );
}

/* ---------- PAYMENT FORM ---------- */
function PaymentForm({
  clientId,
  onSuccess,
}: {
  clientId: number;
  onSuccess: () => void;
}) {
  const { mutate, isPending } = useCreatePayment();
  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    notes: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      {
        clientId,
        amount: form.amount,
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      },
      { onSuccess }
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-4">
      <div>
        <label className="text-sm font-medium">Amount ($)</label>
        <Input
          type="number"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="mt-1"
          placeholder="0"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Payment Date</label>
        <Input
          type="date"
          required
          value={form.paymentDate}
          onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Payment Method</label>
        <Select
          value={form.paymentMethod}
          onValueChange={(val) => setForm({ ...form, paymentMethod: val })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Cash", "Bank Transfer", "Cheque", "Credit Card", "Online"].map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="mt-1"
          rows={2}
        />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : "Record Payment"}
      </Button>
    </form>
  );
}

/* ---------- PROFIT SIMULATOR ---------- */
function ProfitSimulator({ totalCost }: { totalCost: number }) {
  const [markup, setMarkup] = useState(20);

  const sim = useMemo(() => {
    const suggestedPrice = totalCost * (1 + markup / 100);
    const expectedProfit = suggestedPrice - totalCost;
    const profitMargin = suggestedPrice > 0 ? (expectedProfit / suggestedPrice) * 100 : 0;
    return { suggestedPrice, expectedProfit, profitMargin };
  }, [totalCost, markup]);

  return (
    <Card className="border border-slate-100 shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <CardTitle className="text-base">Profit Simulator</CardTitle>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Calculate suggested pricing based on your markup</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Cost base */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Cost</span>
            <span className="font-semibold text-slate-800">${totalCost.toLocaleString()}</span>
          </div>

          {/* Markup input */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Markup Percentage
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={markup}
                onChange={(e) => setMarkup(Number(e.target.value))}
                className="flex-1 accent-indigo-600 h-2 cursor-pointer"
                data-testid="input-markup-slider"
              />
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 min-w-[60px] justify-center">
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={markup}
                  onChange={(e) => setMarkup(Math.max(0, Number(e.target.value)))}
                  className="border-0 bg-transparent p-0 text-center text-sm font-bold w-10 focus-visible:ring-0"
                  data-testid="input-markup-percent"
                />
                <span className="text-xs text-slate-500 font-semibold">%</span>
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {[10, 15, 20, 25, 30].map((p) => (
              <button
                key={p}
                onClick={() => setMarkup(p)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  markup === p
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                data-testid={`button-markup-preset-${p}`}
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Suggested Price</span>
              <span className="font-bold text-base text-indigo-600" data-testid="text-suggested-price">
                ${Math.round(sim.suggestedPrice).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Expected Profit</span>
              <span className={`font-bold text-base ${sim.expectedProfit >= 0 ? "text-emerald-600" : "text-red-500"}`} data-testid="text-expected-profit">
                ${Math.round(sim.expectedProfit).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Profit Margin</span>
              <span className={`font-semibold text-sm ${sim.profitMargin >= 0 ? "text-emerald-600" : "text-red-500"}`} data-testid="text-profit-margin">
                {sim.profitMargin.toFixed(1)}%
              </span>
            </div>

            {/* Margin bar */}
            {totalCost > 0 && (
              <div className="mt-1">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(sim.profitMargin, 100).toFixed(1)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-right">{sim.profitMargin.toFixed(1)}% of suggested price is profit</p>
              </div>
            )}

            {totalCost === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">Add services or expenses to see calculations.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- VENDOR PAYMENT FORM ---------- */
function VendorPaymentForm({
  clientId,
  services,
  vendors,
  onSuccess,
}: {
  clientId: number;
  services: any[];
  vendors: any[];
  onSuccess: () => void;
}) {
  const { mutate, isPending } = useCreateVendorPayment();
  const [form, setForm] = useState({
    vendorId: "",
    serviceId: "",
    amount: "",
    status: "Unpaid",
    paymentDate: "",
    notes: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      {
        clientId,
        vendorId: Number(form.vendorId),
        serviceId: form.serviceId ? Number(form.serviceId) : undefined,
        amount: form.amount,
        status: form.status,
        paymentDate: form.paymentDate || undefined,
        notes: form.notes || undefined,
      },
      { onSuccess }
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-4">
      <div>
        <label className="text-sm font-medium">Vendor</label>
        <Select
          value={form.vendorId}
          onValueChange={(val) => setForm({ ...form, vendorId: val })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Related Service (optional)</label>
        <Select
          value={form.serviceId}
          onValueChange={(val) => setForm({ ...form, serviceId: val })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.serviceName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Amount ($)</label>
        <Input
          type="number"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="mt-1"
          placeholder="0"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Status</label>
        <Select
          value={form.status}
          onValueChange={(val) => setForm({ ...form, status: val })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Payment Date (optional)</label>
        <Input
          type="date"
          value={form.paymentDate}
          onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="mt-1"
          rows={2}
        />
      </div>
      <Button type="submit" disabled={isPending || !form.vendorId} className="w-full">
        {isPending ? "Saving..." : "Add Vendor Payment"}
      </Button>
    </form>
  );
}
