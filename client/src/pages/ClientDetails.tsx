import React, { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import {
  useClient,
  useDeletePlannedService,
  useUpdatePlannedService,
  useUpdateClient,
  useDeletePayment,
  useUpdateVendorPayment,
  useDeleteVendorPayment,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTasks,
} from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import { Link, useRoute, useLocation } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bot,
  Square,
  SquareCheck,
  ListChecks,
  CalendarDays,
  FileText,
  MoreHorizontal,
  LayoutDashboard,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import type {
  Client,
  PlannedService,
  Payment,
  VendorPayment,
  Expense,
  Task,
} from "@shared/schema";
import { ServiceForm } from "@/components/clients/service-form";
import { PaymentForm } from "@/components/clients/payment-form";
import { VendorPaymentForm } from "@/components/clients/vendor-payment-form";
import { ProfitSimulator } from "@/components/clients/profit-simulator";

/* ─── Extended client type with relations ─── */
interface ClientWithRelations extends Client {
  services?: PlannedService[];
  payments?: Payment[];
  vendorPayments?: VendorPayment[];
  expenses?: Expense[];
}

/* ─── Vendor shape ─── */
interface Vendor {
  id: number;
  name: string;
}

/* ─── ServiceRow ─── */
interface ServiceRowProps {
  service: PlannedService;
  vendor: Vendor | undefined;
  serviceTasks: Task[];
  isExpanded: boolean;
  clientId: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onToggleTask: (taskId: number, currentStatus: string) => void;
  onDeleteTask: (taskId: number) => void;
}

function ServiceRow({
  service,
  vendor,
  serviceTasks,
  isExpanded,
  clientId,
  onEdit,
  onDelete,
  onToggleExpand,
  onToggleTask,
  onDeleteTask,
}: ServiceRowProps) {
  const completedCount = serviceTasks.filter((t) => t.status === "Completed").length;

  return (
    <React.Fragment>
      <TableRow className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
        <TableCell className="pl-6">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              {service.serviceName}
            </span>
            {vendor && (
              <span className="text-xs text-indigo-500 dark:text-indigo-400">
                {vendor.name}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="font-medium text-slate-800 dark:text-slate-200 text-sm">
          ${Number(service.cost).toLocaleString()}
        </TableCell>
        <TableCell className="text-sm text-slate-500 dark:text-slate-400">
          {service.notes || "—"}
        </TableCell>
        <TableCell className="text-right pr-6">
          <div className="flex justify-end items-center gap-2">
            {serviceTasks.length > 0 && (
              <button
                onClick={onToggleExpand}
                title="View AI tasks"
                className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{completedCount}/{serviceTasks.length}</span>
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && serviceTasks.length > 0 && (
        <TableRow>
          <TableCell
            colSpan={4}
            className="p-0 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30"
          >
            <div className="px-6 py-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  AI Checklist — {service.serviceName}
                </span>
                <span className="text-xs text-slate-400 ml-1">
                  {completedCount}/{serviceTasks.length} done
                </span>
              </div>
              <ul className="space-y-0.5">
                {serviceTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-2.5 py-1 group rounded-lg">
                    <button
                      onClick={() => onToggleTask(task.id, task.status)}
                      className="shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      {task.status === "Completed"
                        ? <SquareCheck className="w-4 h-4 text-emerald-500" />
                        : <Square className="w-4 h-4" />}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        task.status === "Completed"
                          ? "line-through text-slate-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {task.title}
                    </span>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

/* ─── Main Page ─── */
export default function ClientDetails() {
  const [, params] = useRoute("/clients/:id");
  const [, navigate] = useLocation();
  const id = Number(params?.id);

  const { data: rawClient, isLoading } = useClient(id);
  const client = rawClient as ClientWithRelations | undefined;

  const { data: venues } = useVenues();
  const { data: rawVendors } = useVendors();
  const vendors = rawVendors as Vendor[] | undefined;

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
  const [editingService, setEditingService] = useState<PlannedService | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isVendorPaymentDialogOpen, setIsVendorPaymentDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<number>>(new Set());

  const toggleServiceExpand = (serviceId: number) =>
    setExpandedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });

  /* ── Derived financials ── */
  const selectedVenue = useMemo(
    () => venues?.find((v) => v.id === client?.venueId),
    [venues, client?.venueId]
  );
  const venueCost = selectedVenue ? Number(selectedVenue.basePrice) : 0;
  const totalPlannedCost =
    client?.services?.reduce((sum, s) => sum + Number(s.cost), 0) ?? 0;
  const totalManualExpenses =
    client?.expenses?.reduce((sum, e) => sum + Number(e.cost), 0) ?? 0;
  const totalCost = venueCost + totalPlannedCost + totalManualExpenses;
  const budget = client?.budget ? Number(client.budget) : 0;
  const totalPaid =
    client?.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const remainingBalance = budget - totalPaid;
  const vendorPaymentsPending =
    client?.vendorPayments
      ?.filter((vp) => vp.status === "Unpaid")
      .reduce((sum, vp) => sum + Number(vp.amount), 0) ?? 0;
  const profit = budget - totalCost;
  const profitPercentage = budget > 0 ? ((profit / budget) * 100).toFixed(1) : "0";

  /* ── Loading / error states ── */
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-slate-500 font-medium">Client not found</p>
          <Link href="/clients">
            <Button variant="outline" size="sm">Back to Clients</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  /* ── Task helpers ── */
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({
      clientId: id,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || undefined,
    });
    setNewTaskTitle("");
    setNewTaskDueDate("");
  };

  return (
    <Layout title="Client Profile">
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs gap-1.5">
                Actions <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => navigate(`/events?clientId=${client.id}`)}
                data-testid="button-create-event-from-client"
              >
                <CalendarDays className="w-3.5 h-3.5 mr-2 text-indigo-500" />
                Create Event
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/quotations?clientId=${client.id}`)}
                data-testid="button-create-quote-from-client"
              >
                <FileText className="w-3.5 h-3.5 mr-2 text-violet-500" />
                New Quote
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/clients")}>
                <ArrowLeft className="w-3.5 h-3.5 mr-2 text-slate-400" />
                Done
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Profile card ── */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-2xl gradient-indigo flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-sm shadow-indigo-900/20">
                {client.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {client.name}
                  </h1>
                  <span
                    className={`chip ${
                      client.status === "Confirmed"
                        ? "badge-emerald"
                        : client.status === "Completed"
                        ? "badge-indigo"
                        : "badge-slate"
                    }`}
                  >
                    {client.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {client.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {client.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(client.eventDate), "MMM d, yyyy")}
                  </span>
                  {client.guestCount && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {client.guestCount} guests
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Select
                value={client.venueId ? String(client.venueId) : ""}
                onValueChange={(val) =>
                  updateClient.mutate({ id: client.id, venueId: val ? Number(val) : undefined })
                }
              >
                <SelectTrigger className="h-8 w-48 rounded-xl text-xs border-slate-200">
                  <SelectValue placeholder="Assign venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues?.map((venue) => (
                    <SelectItem key={venue.id} value={String(venue.id)}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Budget",         value: `$${budget.toLocaleString()}`,                   cls: "text-slate-800 dark:text-slate-200" },
            { label: "Total Expenses", value: `$${totalCost.toLocaleString()}`,                 cls: "text-amber-600 dark:text-amber-400" },
            { label: "Received",       value: `$${totalPaid.toLocaleString()}`,                 cls: "text-emerald-600" },
            { label: "Balance Due",    value: `$${remainingBalance.toLocaleString()}`,          cls: remainingBalance > 0 ? "text-red-600" : "text-emerald-600" },
            { label: "Vendor Pending", value: `$${vendorPaymentsPending.toLocaleString()}`,     cls: "text-red-500" },
            { label: "Net Profit",     value: `$${profit.toLocaleString()}`,                    cls: profit >= 0 ? "text-emerald-600" : "text-red-600" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="stat-card">
              <p className="eyebrow mb-1.5">{label}</p>
              <p className={`text-sm md:text-[18px] font-bold tracking-tight leading-none ${cls}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-10 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-0.5">
            <TabsTrigger value="overview" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview &amp;</span> Checklist
            </TabsTrigger>
            <TabsTrigger value="ledger" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Financial</span> Ledger
            </TabsTrigger>
            <TabsTrigger value="simulations" className="rounded-lg text-xs gap-1.5 data-[state=active]:shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulations &amp;</span> Insights
            </TabsTrigger>
          </TabsList>

          {/* ──────────────────────────────────────────────
              TAB 1 — Overview & Checklist
          ────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-4">
            <Card className="border border-slate-100 dark:border-slate-700 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-slate-400" />
                    <CardTitle className="text-base">Event Checklist</CardTitle>
                    <span className="text-xs text-slate-400 ml-1">
                      {taskList.filter((t) => t.status === "Completed").length}/{taskList.length} done
                    </span>
                  </div>
                </div>
                {/* Inline add-task */}
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add a task…"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
                    className="flex-1 h-9 rounded-xl text-sm"
                    data-testid="input-task-title"
                  />
                  <Input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-36 h-9 rounded-xl text-sm"
                    data-testid="input-task-due-date"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!newTaskTitle.trim() || createTask.isPending}
                    onClick={addTask}
                    className="h-9 rounded-xl px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {taskList.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">
                    No tasks yet — add one above.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {taskList.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors group"
                      >
                        <button
                          onClick={() =>
                            updateTask.mutate({
                              id: task.id,
                              clientId: id,
                              status: task.status === "Completed" ? "Pending" : "Completed",
                            })
                          }
                          className="shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
                          data-testid={`button-toggle-task-${task.id}`}
                        >
                          {task.status === "Completed"
                            ? <SquareCheck className="w-5 h-5 text-emerald-500" />
                            : <Square className="w-5 h-5" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-sm ${
                                task.status === "Completed"
                                  ? "line-through text-slate-400"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.aiGenerated && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Sparkles className="w-2.5 h-2.5" /> AI
                              </span>
                            )}
                          </div>
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
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                          data-testid={`button-delete-task-${task.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ──────────────────────────────────────────────
              TAB 2 — Financial Ledger
          ────────────────────────────────────────────── */}
          <TabsContent value="ledger" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left — tables */}
              <div className="lg:col-span-2 flex flex-col gap-4">

                {/* Planned Services */}
                <Card className="border border-slate-100 dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                    <CardTitle className="text-base">Planned Services</CardTitle>
                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setEditingService(null)}>
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingService ? "Edit Service" : "Add Service"}
                          </DialogTitle>
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
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-slate-100 dark:border-slate-700">
                            <TableHead className="pl-6 text-[11px]">Service</TableHead>
                            <TableHead className="text-[11px]">Cost</TableHead>
                            <TableHead className="text-[11px]">Notes</TableHead>
                            <TableHead className="text-right pr-6 text-[11px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedVenue && (
                            <TableRow className="bg-slate-50/70 dark:bg-slate-700/20">
                              <TableCell className="font-medium text-slate-600 dark:text-slate-400 pl-6 text-sm">
                                Venue — {selectedVenue.name}
                              </TableCell>
                              <TableCell className="text-sm">${venueCost.toLocaleString()}</TableCell>
                              <TableCell className="text-sm text-slate-400">—</TableCell>
                              <TableCell />
                            </TableRow>
                          )}

                          {client.services?.map((service) => {
                            const serviceTasks = taskList.filter(
                              (t) => t.serviceId === service.id
                            );
                            return (
                              <ServiceRow
                                key={service.id}
                                service={service}
                                vendor={vendors?.find((v) => v.id === service.vendorId)}
                                serviceTasks={serviceTasks}
                                isExpanded={expandedServiceIds.has(service.id)}
                                clientId={id}
                                onEdit={() => {
                                  setEditingService(service);
                                  setIsServiceDialogOpen(true);
                                }}
                                onDelete={() =>
                                  deleteService.mutate({
                                    clientId: client.id,
                                    serviceId: service.id,
                                  })
                                }
                                onToggleExpand={() => toggleServiceExpand(service.id)}
                                onToggleTask={(taskId, currentStatus) =>
                                  updateTask.mutate({
                                    id: taskId,
                                    clientId: id,
                                    status: currentStatus === "Completed" ? "Pending" : "Completed",
                                  })
                                }
                                onDeleteTask={(taskId) =>
                                  deleteTask.mutate({ id: taskId, clientId: id })
                                }
                              />
                            );
                          })}

                          {totalCost > 0 && (
                            <TableRow className="bg-blue-50/60 dark:bg-blue-950/20 font-semibold border-t border-blue-100 dark:border-blue-900/30">
                              <TableCell className="pl-6 text-sm">Total</TableCell>
                              <TableCell className="text-blue-700 dark:text-blue-300 font-bold text-sm">
                                ${totalCost.toLocaleString()}
                              </TableCell>
                              <TableCell colSpan={2} />
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Payments */}
                <Card className="border border-slate-100 dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div>
                      <CardTitle className="text-base">Client Payments</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Paid:{" "}
                        <span className="font-semibold text-emerald-600">
                          ${totalPaid.toLocaleString()}
                        </span>
                        {" · "}Remaining:{" "}
                        <span
                          className={`font-semibold ${
                            remainingBalance > 0 ? "text-red-500" : "text-emerald-600"
                          }`}
                        >
                          ${remainingBalance.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Payment
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
                    {!client.payments?.length ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No payments recorded yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-slate-100 dark:border-slate-700">
                              <TableHead className="pl-6 text-[11px]">Date</TableHead>
                              <TableHead className="text-[11px]">Amount</TableHead>
                              <TableHead className="text-[11px]">Method</TableHead>
                              <TableHead className="text-[11px]">Notes</TableHead>
                              <TableHead className="text-right pr-6 text-[11px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {client.payments.map((p) => (
                              <TableRow key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                <TableCell className="pl-6 text-sm text-slate-500">
                                  {format(new Date(p.paymentDate), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell className="text-sm font-semibold text-emerald-600">
                                  ${Number(p.amount).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm text-slate-500">{p.paymentMethod}</TableCell>
                                <TableCell className="text-sm text-slate-500">{p.notes || "—"}</TableCell>
                                <TableCell className="text-right pr-6">
                                  <button
                                    onClick={() => deletePayment.mutate({ id: p.id, clientId: client.id })}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vendor Payments */}
                <Card className="border border-slate-100 dark:border-slate-700 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                    <div>
                      <CardTitle className="text-base">Vendor Payments</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        Pending:{" "}
                        <span className="font-semibold text-red-500">
                          ${vendorPaymentsPending.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <Dialog
                      open={isVendorPaymentDialogOpen}
                      onOpenChange={setIsVendorPaymentDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Vendor Payment</DialogTitle>
                        </DialogHeader>
                        <VendorPaymentForm
                          clientId={id}
                          services={client.services ?? []}
                          vendors={vendors ?? []}
                          onSuccess={() => setIsVendorPaymentDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!client.vendorPayments?.length ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No vendor payments recorded yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-slate-100 dark:border-slate-700">
                              <TableHead className="pl-6 text-[11px]">Vendor</TableHead>
                              <TableHead className="text-[11px]">Amount</TableHead>
                              <TableHead className="text-[11px]">Status</TableHead>
                              <TableHead className="text-[11px]">Date</TableHead>
                              <TableHead className="text-right pr-6 text-[11px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {client.vendorPayments.map((vp) => (
                              <TableRow key={vp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors">
                                <TableCell className="pl-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {vendors?.find((v) => v.id === vp.vendorId)?.name ??
                                    `Vendor #${vp.vendorId}`}
                                </TableCell>
                                <TableCell className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                  ${Number(vp.amount).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={vp.status === "Paid" ? "default" : "secondary"}
                                    className={
                                      vp.status === "Paid"
                                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-0"
                                        : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-0"
                                    }
                                  >
                                    {vp.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-slate-500">
                                  {vp.paymentDate
                                    ? format(new Date(vp.paymentDate), "MMM dd, yyyy")
                                    : "—"}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-1">
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
                                        title="Mark as Paid"
                                        className="p-1 text-slate-300 hover:text-emerald-500 transition-colors"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        deleteVendorPayment.mutate({
                                          id: vp.id,
                                          clientId: client.id,
                                        })
                                      }
                                      className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right — Budget Overview */}
              <div>
                <Card className="border border-slate-100 dark:border-slate-700 shadow-sm sticky top-4">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700">
                    <CardTitle className="text-base">Budget Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <p className="eyebrow mb-2">Revenue</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Client Budget</span>
                          <span className="font-bold text-lg text-slate-900 dark:text-white">
                            ${budget.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="border-t dark:border-slate-700 pt-4">
                        <p className="eyebrow mb-2">Expenses</p>
                        {selectedVenue && (
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-slate-500">Venue</span>
                            <span>${venueCost.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-500">Services</span>
                          <span>${totalPlannedCost.toLocaleString()}</span>
                        </div>
                        {totalManualExpenses > 0 && (
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-slate-500">Extra</span>
                            <span>${totalManualExpenses.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold border-t dark:border-slate-700 pt-2 mt-2 text-sm">
                          <span>Total</span>
                          <span>${totalCost.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="border-t dark:border-slate-700 pt-4">
                        <p className="eyebrow mb-2">Profit</p>
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

                      <div className="border-t dark:border-slate-700 pt-4">
                        <p className="eyebrow mb-2">Payment Status</p>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-500">Paid</span>
                          <span className="text-emerald-600 font-medium">
                            ${totalPaid.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Balance Due</span>
                          <span
                            className={`font-medium ${
                              remainingBalance > 0 ? "text-red-500" : "text-emerald-600"
                            }`}
                          >
                            ${remainingBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ──────────────────────────────────────────────
              TAB 3 — Simulations & Insights
          ────────────────────────────────────────────── */}
          <TabsContent value="simulations" className="mt-4">
            <div className="max-w-md">
              <ProfitSimulator totalCost={totalCost} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
