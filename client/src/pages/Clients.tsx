import { Layout } from "@/components/Layout";
import { useClients, useCreateClient, useCreatePlannedService } from "@/hooks/use-clients";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus, Eye, Trash2, ArrowUp, ArrowDown, Users,
  Calendar, DollarSign, AlertCircle, Clock, CalendarDays, FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { useLocation } from "wouter";

function getPriority(eventDate: Date) {
  const today = new Date();
  const daysLeft = differenceInDays(eventDate, today);
  if (daysLeft < 0)   return { label: "Overdue", color: "badge-slate",  text: `${Math.abs(daysLeft)}d ago`, level: "Overdue" };
  if (daysLeft <= 7)  return { label: "High",    color: "badge-red",    text: `${daysLeft}d left`,          level: "High"    };
  if (daysLeft <= 30) return { label: "Medium",  color: "badge-amber",  text: `${daysLeft}d left`,          level: "Medium"  };
  return                     { label: "Low",     color: "badge-green",  text: `${daysLeft}d left`,          level: "Low"     };
}

const statusStyle: Record<string, string> = {
  Lead:      "badge-slate",
  Pending:   "badge-amber",
  Confirmed: "badge-green",
  Completed: "badge-indigo",
};

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "budget" | "priority">("priority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [, setLocation] = useLocation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/clients/${deleteId}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setDeleteId(null);
    } catch {
      alert("Failed to delete client");
    }
  };

  const totalClients = clients?.length || 0;
  const highPriorityCount = clients?.filter((c) => getPriority(new Date(c.eventDate)).level === "High").length || 0;
  const upcomingCount = clients?.filter((c) => {
    const d = differenceInDays(new Date(c.eventDate), new Date());
    return d >= 0 && d <= 30;
  }).length || 0;
  const totalPipelineBudget = clients?.reduce((s, c) => s + Number(c.budget || 0), 0) || 0;

  const filteredClients = clients
    ?.filter((c) => {
      const p = getPriority(new Date(c.eventDate));
      return (
        (filter === "All" || p.level === filter) &&
        (statusFilter === "All" || c.status === statusFilter) &&
        (typeFilter === "All" || c.eventType === typeFilter) &&
        (c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.eventType.toLowerCase().includes(search.toLowerCase()) ||
          c.status.toLowerCase().includes(search.toLowerCase()))
      );
    })
    ?.sort((a, b) => {
      let result = 0;
      if (sortBy === "date") result = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      if (sortBy === "budget") result = Number(a.budget || 0) - Number(b.budget || 0);
      if (sortBy === "priority") {
        const order: Record<string, number> = { Overdue: 0, High: 1, Medium: 2, Low: 3 };
        result = order[getPriority(new Date(a.eventDate)).level] - order[getPriority(new Date(b.eventDate)).level];
      }
      return sortOrder === "asc" ? result : -result;
    });

  const filteredCount = filteredClients?.length || 0;

  const handleExportCSV = () => {
    if (!filteredClients?.length) return alert("No clients to export");
    const headers = ["Name", "Email", "Phone", "Event Date", "Event Type", "Budget", "Status"];
    const rows = filteredClients.map((c) => [c.name, c.email, c.phone, format(new Date(c.eventDate), "yyyy-MM-dd"), c.eventType, c.budget || "0", c.status]);
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "clients_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : null;

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const selectCls = "h-9 border border-slate-100 dark:border-slate-700 rounded-xl px-3 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <Layout title="Clients">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Management</p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Client Events</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="h-9 text-xs rounded-xl hidden sm:flex">
            Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-900/20 text-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                New Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <CreateClientForm onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Clients",    value: totalClients,                               icon: Users,        cls: "text-slate-800 dark:text-slate-200" },
          { label: "High Priority",    value: highPriorityCount,                          icon: AlertCircle,  cls: "text-red-600 dark:text-red-400"   },
          { label: "Upcoming (30d)",   value: upcomingCount,                              icon: Calendar,     cls: "text-amber-600 dark:text-amber-400" },
          { label: "Pipeline Budget",  value: `$${totalPipelineBudget.toLocaleString()}`, icon: DollarSign,   cls: "text-indigo-600 dark:text-indigo-400" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
              <Icon className={`w-4 h-4 ${cls} opacity-60`} />
            </div>
            <p className={`text-xl md:text-2xl font-bold tracking-tight ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
        <div className="p-4 md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:gap-3">
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-xl text-sm md:flex-1"
            />
            <div className="grid grid-cols-3 gap-2 md:contents">
              {[
                { value: filter, onChange: setFilter, options: [["All", "All Priority"], ["High", "High"], ["Medium", "Medium"], ["Low", "Low"], ["Overdue", "Overdue"]] },
                { value: statusFilter, onChange: setStatusFilter, options: [["All", "All Status"], ["Lead", "Lead"], ["Pending", "Pending"], ["Confirmed", "Confirmed"], ["Completed", "Completed"]] },
                { value: typeFilter, onChange: setTypeFilter, options: [["All", "All Types"], ["Wedding", "Wedding"], ["Corporate", "Corporate"], ["Birthday", "Birthday"], ["Engagement", "Engagement"], ["Conference", "Conference"]] },
              ].map(({ value, onChange, options }, i) => (
                <select
                  key={i}
                  className={selectCls}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                >
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-400 font-medium">Showing {filteredCount} of {totalClients} clients</p>
            {(filter !== "All" || statusFilter !== "All" || typeFilter !== "All" || search) && (
              <button
                onClick={() => { setFilter("All"); setStatusFilter("All"); setTypeFilter("All"); setSearch(""); }}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Desktop Table */}
      <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80 hidden md:block">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/30">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 pl-5">Name</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 select-none" onClick={() => toggleSort("date")}>
                  <div className="flex items-center gap-1">Date <SortIcon col="date" /></div>
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 select-none" onClick={() => toggleSort("priority")}>
                  <div className="flex items-center gap-1">Priority <SortIcon col="priority" /></div>
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 text-right select-none" onClick={() => toggleSort("budget")}>
                  <div className="flex items-center justify-end gap-1">Budget <SortIcon col="budget" /></div>
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-4">
                      <div className="h-5 w-full bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !filteredClients?.length ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <Users className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No clients found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const priority = getPriority(new Date(client.eventDate));
                  return (
                    <TableRow
                      key={client.id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                      onClick={() => setLocation(`/clients/${client.id}`)}
                    >
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200 pl-5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(client.eventDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className={`chip ${priority.color}`}>
                            {priority.label}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{priority.text}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400">{client.eventType}</TableCell>
                      <TableCell className="text-right font-bold text-slate-800 dark:text-slate-200">
                        {client.budget ? `$${Number(client.budget).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`chip ${statusStyle[client.status] || "badge-slate"}`}>
                          {client.status}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="Create Event"
                            data-testid={`button-create-event-${client.id}`}
                            onClick={() => setLocation(`/events?clientId=${client.id}`)}
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                            title="New Quote"
                            data-testid={`button-create-quote-${client.id}`}
                            onClick={() => setLocation(`/quotations?clientId=${client.id}`)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setLocation(`/clients/${client.id}`)}>
                            <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setDeleteId(client.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-700" />)
        ) : !filteredClients?.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No clients found</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const priority = getPriority(new Date(client.eventDate));
            return (
              <div
                key={client.id}
                onClick={() => setLocation(`/clients/${client.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{client.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{client.eventType}</p>
                  </div>
                  <span className={`chip ${statusStyle[client.status] || "badge-slate"}`}>
                    {client.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(client.eventDate), "MMM d, yyyy")}</span>
                    <span className={`chip ${priority.color} text-[10px]`}>{priority.label}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {client.budget ? `$${Number(client.budget).toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setLocation(`/events?clientId=${client.id}`)}
                    data-testid={`button-mobile-create-event-${client.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
                  >
                    <CalendarDays className="w-3 h-3" /> Create Event
                  </button>
                  <button
                    onClick={() => setLocation(`/quotations?clientId=${client.id}`)}
                    data-testid={`button-mobile-create-quote-${client.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
                  >
                    <FileText className="w-3 h-3" /> New Quote
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Are you sure? This cannot be undone.</p>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

/* ─── Create Client Form ─── */
const EVENT_TEMPLATES: Record<string, string[]> = {
  Wedding:    ["Venue", "Catering", "Decoration", "Photography", "DJ"],
  Corporate:  ["Venue", "Catering", "AV Equipment", "Photography"],
  Birthday:   ["Venue", "Catering", "Decoration", "Photography"],
  Engagement: ["Venue", "Catering", "Decoration", "Photography"],
  Conference: ["Venue", "Catering", "AV Equipment"],
};

function CreateClientForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateClient();
  const { mutateAsync: createService } = useCreatePlannedService();
  const [, setLocation] = useLocation();
  const [customEventType, setCustomEventType] = useState("");
  const [applyTemplate, setApplyTemplate] = useState(true);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", eventDate: "",
    eventType: "Wedding", budget: "", guestCount: "", status: "Lead", notes: "",
  });

  const handleChange = (key: string, value: string) => setFormData((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.eventDate) {
      return alert("Please fill all required fields");
    }
    const finalEventType = formData.eventType === "Other" && customEventType ? customEventType : formData.eventType;
    mutate(
      { ...formData, eventType: finalEventType, eventDate: new Date(formData.eventDate) },
      {
        onSuccess: async (newClient: any) => {
          if (applyTemplate && EVENT_TEMPLATES[finalEventType]) {
            await Promise.all(
              EVENT_TEMPLATES[finalEventType].map((svc) =>
                createService({ clientId: newClient.id, serviceName: svc, cost: "0", status: "Planned" })
              ),
            );
          }
          onSuccess();
          setLocation(`/clients/${newClient.id}`);
        },
      },
    );
  };

  const inputCls = "h-9 rounded-xl text-sm";
  const selectCls = "w-full h-9 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const labelCls = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block";

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={labelCls}>Name *</label><Input className={inputCls} placeholder="Client / Event name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} /></div>
        <div><label className={labelCls}>Email *</label><Input className={inputCls} placeholder="email@example.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} /></div>
        <div><label className={labelCls}>Phone *</label><Input className={inputCls} placeholder="+1 555 0000" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} /></div>
        <div><label className={labelCls}>Event Date *</label><Input className={inputCls} type="date" value={formData.eventDate} onChange={(e) => handleChange("eventDate", e.target.value)} /></div>
        <div>
          <label className={labelCls}>Event Type</label>
          <select className={selectCls} value={formData.eventType} onChange={(e) => handleChange("eventType", e.target.value)}>
            {["Wedding","Corporate","Birthday","Engagement","Conference","Other"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {formData.eventType === "Other" && (
          <div><label className={labelCls}>Custom Type</label><Input className={inputCls} placeholder="Event type name" value={customEventType} onChange={(e) => setCustomEventType(e.target.value)} /></div>
        )}
        <div><label className={labelCls}>Budget ($)</label><Input className={inputCls} type="number" placeholder="25000" value={formData.budget} onChange={(e) => handleChange("budget", e.target.value)} /></div>
        <div><label className={labelCls}>Guest Count</label><Input className={inputCls} type="number" placeholder="150" value={formData.guestCount} onChange={(e) => handleChange("guestCount", e.target.value)} /></div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={selectCls} value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
            {["Lead","Pending","Confirmed","Completed"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
        <input
          type="checkbox"
          id="template"
          checked={applyTemplate}
          onChange={(e) => setApplyTemplate(e.target.checked)}
          className="accent-indigo-600 w-4 h-4"
        />
        <label htmlFor="template" className="text-xs text-indigo-700 dark:text-indigo-300 font-medium cursor-pointer">
          Auto-create default services from event template
        </label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700"
      >
        {isPending ? "Creating..." : "Create Client"}
      </Button>
    </div>
  );
}
