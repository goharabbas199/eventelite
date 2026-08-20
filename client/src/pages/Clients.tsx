import { Layout } from "@/components/Layout";
import { useClients } from "@/hooks/use-clients";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Eye, Trash2, ArrowUp, ArrowDown, Users,
  Calendar, DollarSign, AlertCircle, CalendarDays, FileText,
  Search, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { useLocation } from "wouter";
import type { Client } from "@shared/schema";
import { CreateClientForm } from "@/components/clients/create-client-form";

/* ─── Helpers ─── */
function getPriority(eventDate: Date) {
  const daysLeft = differenceInDays(eventDate, new Date());
  if (daysLeft < 0)   return { label: "Overdue", color: "badge-slate",  text: `${Math.abs(daysLeft)}d ago`, level: "Overdue" };
  if (daysLeft <= 7)  return { label: "High",    color: "badge-red",    text: `${daysLeft}d left`,          level: "High"    };
  if (daysLeft <= 30) return { label: "Medium",  color: "badge-amber",  text: `${daysLeft}d left`,          level: "Medium"  };
  return                     { label: "Low",     color: "badge-green",  text: `${daysLeft}d left`,          level: "Low"     };
}

const STATUS_STYLE: Record<string, string> = {
  Lead:      "badge-slate",
  Pending:   "badge-amber",
  Confirmed: "badge-green",
  Completed: "badge-indigo",
};

type SortCol   = "date" | "budget" | "priority";
type SortOrder = "asc" | "desc";

/* ─── Mobile card list ─── */
interface MobileClientListProps {
  clients: Client[];
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

function MobileClientList({ clients, isLoading, onNavigate }: MobileClientListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white dark:bg-zinc-800 rounded-2xl animate-pulse border border-slate-100 dark:border-zinc-700"
          />
        ))}
      </div>
    );
  }

  if (!clients.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700">
        <Users className="w-10 h-10 text-slate-300 dark:text-zinc-600" />
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">No clients found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((client) => {
        const priority = getPriority(new Date(client.eventDate));
        return (
          <div
            key={client.id}
            onClick={() => onNavigate(`/clients/${client.id}`)}
            className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm">{client.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{client.eventType}</p>
              </div>
              <span className={`chip ${STATUS_STYLE[client.status] ?? "badge-slate"}`}>
                {client.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(client.eventDate), "MMM d, yyyy")}
                </span>
                <span className={`chip ${priority.color} text-[10px]`}>{priority.label}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                {client.budget ? `$${Number(client.budget).toLocaleString()}` : "—"}
              </p>
            </div>

            <div
              className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-700"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onNavigate(`/events?clientId=${client.id}`)}
                data-testid={`button-mobile-create-event-${client.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
              >
                <CalendarDays className="w-3 h-3" /> Create Event
              </button>
              <button
                onClick={() => onNavigate(`/quotations?clientId=${client.id}`)}
                data-testid={`button-mobile-create-quote-${client.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
              >
                <FileText className="w-3 h-3" /> New Quote
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ─── */
export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortCol>("priority");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
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

  const handleExportCSV = () => {
    if (!filteredClients?.length) return alert("No clients to export");
    const headers = ["Name", "Email", "Phone", "Event Date", "Event Type", "Budget", "Status"];
    const rows = filteredClients.map((c) => [
      c.name, c.email, c.phone,
      format(new Date(c.eventDate), "yyyy-MM-dd"),
      c.eventType, c.budget ?? "0", c.status,
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "clients_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (col: SortCol) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("asc"); }
  };

  const SortIcon = ({ col }: { col: SortCol }) =>
    sortBy === col
      ? sortOrder === "asc"
        ? <ArrowUp className="w-3 h-3" />
        : <ArrowDown className="w-3 h-3" />
      : null;

  /* Derived stats */
  const totalClients = clients?.length ?? 0;
  const highPriorityCount =
    clients?.filter((c) => getPriority(new Date(c.eventDate)).level === "High").length ?? 0;
  const upcomingCount =
    clients?.filter((c) => {
      const d = differenceInDays(new Date(c.eventDate), new Date());
      return d >= 0 && d <= 30;
    }).length ?? 0;
  const totalPipelineBudget =
    clients?.reduce((s, c) => s + Number(c.budget ?? 0), 0) ?? 0;

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
      if (sortBy === "date")
        result = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      if (sortBy === "budget")
        result = Number(a.budget ?? 0) - Number(b.budget ?? 0);
      if (sortBy === "priority") {
        const order: Record<string, number> = { Overdue: 0, High: 1, Medium: 2, Low: 3 };
        result =
          order[getPriority(new Date(a.eventDate)).level] -
          order[getPriority(new Date(b.eventDate)).level];
      }
      return sortOrder === "asc" ? result : -result;
    });

  const filteredCount = filteredClients?.length ?? 0;
  const hasActiveFilters =
    filter !== "All" || statusFilter !== "All" || typeFilter !== "All" || !!search;

  const clearFilters = () => {
    setFilter("All");
    setStatusFilter("All");
    setTypeFilter("All");
    setSearch("");
  };

  const nativeSelectCls =
    "h-9 border-0 border-l border-slate-100 dark:border-zinc-700 px-3 text-sm " +
    "bg-transparent text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-0 " +
    "cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-700/40 transition-colors";

  return (
    <Layout title="Clients">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">
            Management
          </p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Client Events</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-9 text-xs rounded-xl hidden sm:flex"
            data-testid="button-export-clients-csv"
          >
            Export CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-900/20 text-sm"
                data-testid="button-new-client"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Client
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
          { label: "Total Clients",   value: totalClients,                                icon: Users,       cls: "text-slate-800 dark:text-zinc-200" },
          { label: "High Priority",   value: highPriorityCount,                           icon: AlertCircle, cls: "text-red-600 dark:text-red-400" },
          { label: "Upcoming (30d)",  value: upcomingCount,                               icon: Calendar,    cls: "text-amber-600 dark:text-amber-400" },
          { label: "Pipeline Budget", value: `$${totalPipelineBudget.toLocaleString()}`,  icon: DollarSign,  cls: "text-indigo-600 dark:text-indigo-400" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div
            key={label}
            className="stat-card"
            data-testid={`card-client-kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
              <Icon className={`w-4 h-4 ${cls} opacity-50`} />
            </div>
            <p className={`text-xl md:text-2xl font-bold tracking-tight ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Combined filter bar */}
      <div className="bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-stretch divide-x divide-slate-100 dark:divide-zinc-700">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-10 bg-transparent text-sm text-slate-700 dark:text-zinc-300 placeholder-slate-400 focus:outline-none min-w-0"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Priority */}
          <select
            className={nativeSelectCls}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            data-testid="select-client-filter-0"
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Overdue">Overdue</option>
          </select>

          {/* Status */}
          <select
            className={nativeSelectCls}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="select-client-filter-1"
          >
            <option value="All">All Status</option>
            <option value="Lead">Lead</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Type */}
          <select
            className={`${nativeSelectCls} hidden sm:block`}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            data-testid="select-client-filter-2"
          >
            <option value="All">All Types</option>
            <option value="Wedding">Wedding</option>
            <option value="Corporate">Corporate</option>
            <option value="Birthday">Birthday</option>
            <option value="Engagement">Engagement</option>
            <option value="Conference">Conference</option>
          </select>
        </div>

        {/* Filter meta row */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-700/20">
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-600 dark:text-zinc-300">{filteredCount}</span> of {totalClients} clients
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold transition-colors"
              data-testid="button-clear-client-filters"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <Card className="border border-slate-100 dark:border-zinc-700 rounded-2xl shadow-sm bg-white dark:bg-zinc-800/80 hidden md:block">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-700/30">
                <TableHead className="pl-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  Name
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400 cursor-pointer hover:text-indigo-600 select-none"
                  onClick={() => toggleSort("date")}
                >
                  <div className="flex items-center gap-1">Date <SortIcon col="date" /></div>
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400 cursor-pointer hover:text-indigo-600 select-none"
                  onClick={() => toggleSort("priority")}
                >
                  <div className="flex items-center gap-1">Priority <SortIcon col="priority" /></div>
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  Type
                </TableHead>
                <TableHead
                  className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400 cursor-pointer hover:text-indigo-600 text-right select-none"
                  onClick={() => toggleSort("budget")}
                >
                  <div className="flex items-center justify-end gap-1">Budget <SortIcon col="budget" /></div>
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400 pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-3">
                      <div className="h-5 w-full bg-slate-100 dark:bg-zinc-700 animate-pulse rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !filteredClients?.length ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-700 flex items-center justify-center">
                        <Users className="w-7 h-7 text-slate-400 dark:text-zinc-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                        No clients found
                      </p>
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
                      className="border-b border-slate-100 dark:border-zinc-700 hover:bg-slate-50/80 dark:hover:bg-zinc-700/30 transition-colors cursor-pointer group"
                      onClick={() => setLocation(`/clients/${client.id}`)}
                    >
                      <TableCell className="font-semibold text-sm text-slate-800 dark:text-zinc-200 pl-5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-zinc-400">
                        {format(new Date(client.eventDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className={`chip ${priority.color}`}>{priority.label}</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{priority.text}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-zinc-400">
                        {client.eventType}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-slate-800 dark:text-zinc-200">
                        {client.budget ? `$${Number(client.budget).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`chip ${STATUS_STYLE[client.status] ?? "badge-slate"}`}>
                          {client.status}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="Create Event"
                            data-testid={`button-create-event-${client.id}`}
                            onClick={() => setLocation(`/events?clientId=${client.id}`)}
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-lg text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                            title="New Quote"
                            data-testid={`button-create-quote-${client.id}`}
                            onClick={() => setLocation(`/quotations?clientId=${client.id}`)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-lg"
                            title="View"
                            onClick={() => setLocation(`/clients/${client.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 rounded-lg"
                            title="Delete"
                            onClick={() => setDeleteId(client.id)}
                          >
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

      {/* Mobile list */}
      <div className="md:hidden">
        <MobileClientList
          clients={filteredClients ?? []}
          isLoading={isLoading}
          onNavigate={setLocation}
        />
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
            Are you sure? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
