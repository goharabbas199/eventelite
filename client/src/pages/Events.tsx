import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useClients } from "@/hooks/use-clients";
import { useVenues } from "@/hooks/use-venues";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, CalendarDays, Users, MapPin, DollarSign, Trash2,
  Search, Edit2, CheckCircle, Clock, Zap, AlertCircle, Timer,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Engagement", "Conference", "Gala", "Other"];
const EVENT_STATUSES = ["lead", "pending", "confirmed", "completed"];

const STATUS_CONFIG: Record<string, {
  label: string;
  badgeColor: string;
  borderColor: string;
  dotColor: string;
  icon: any;
}> = {
  lead:      { label: "Lead",      badgeColor: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",      borderColor: "border-l-amber-400",   dotColor: "bg-amber-400",   icon: AlertCircle },
  pending:   { label: "Pending",   badgeColor: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",          borderColor: "border-l-blue-500",    dotColor: "bg-blue-500",    icon: Clock },
  confirmed: { label: "Confirmed", badgeColor: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300", borderColor: "border-l-emerald-500", dotColor: "bg-emerald-500", icon: CheckCircle },
  completed: { label: "Completed", badgeColor: "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400",      borderColor: "border-l-slate-400",   dotColor: "bg-slate-400",   icon: Zap },
};

const EVENT_TYPE_EMOJI: Record<string, string> = {
  Wedding: "💍",
  Corporate: "🏢",
  Birthday: "🎂",
  Engagement: "💐",
  Conference: "🎤",
  Gala: "✨",
  Other: "📅",
};

function emptyForm() {
  return {
    clientId: "",
    eventName: "",
    eventType: "Wedding",
    eventDate: "",
    venueId: "",
    guestCount: "",
    budget: "",
    status: "lead",
  };
}

function CountdownBadge({ eventDate, status }: { eventDate: string; status: string }) {
  if (status === "completed") return null;
  const days = differenceInDays(new Date(eventDate), new Date());
  if (days < 0) return null;

  let cls = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400";
  if (days <= 3)  cls = "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400";
  else if (days <= 14) cls = "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400";
  else if (days <= 30) cls = "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400";

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <Timer className="w-2.5 h-2.5" />
      {days === 0 ? "Today!" : `${days}d`}
    </span>
  );
}

export default function Events() {
  const { data: events = [], isLoading } = useEvents();
  const { data: clients = [] } = useClients();
  const { data: venues = [] } = useVenues();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Pre-select client from URL param (e.g. navigating from ClientDetails)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preClientId = params.get("clientId");
    if (!preClientId || !clients || (clients as any[]).length === 0) return;
    const client = (clients as any[]).find((c) => String(c.id) === preClientId);
    if (!client) return;
    const updates: Partial<ReturnType<typeof emptyForm>> = { clientId: preClientId };
    if (client.eventType && EVENT_TYPES.includes(client.eventType)) updates.eventType = client.eventType;
    if (client.guestCount) updates.guestCount = String(client.guestCount);
    if (client.eventDate) {
      try { updates.eventDate = format(new Date(client.eventDate), "yyyy-MM-dd"); } catch {}
    }
    if (client.budget) updates.budget = String(client.budget);
    if (client.venueId) updates.venueId = String(client.venueId);
    updates.eventName = client.name;
    setForm((f) => ({ ...f, ...updates }));
    setEditingEvent(null);
    setDialogOpen(true);
    // Clean URL without reload
    window.history.replaceState({}, "", window.location.pathname);
  }, [clients, location]);

  const filtered = (events as any[]).filter((e) => {
    const client = (clients as any[]).find((c) => c.id === e.clientId);
    const text = `${e.eventName} ${e.eventType} ${client?.name || ""}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: (events as any[]).length,
    lead: (events as any[]).filter((e) => e.status === "lead").length,
    pending: (events as any[]).filter((e) => e.status === "pending").length,
    confirmed: (events as any[]).filter((e) => e.status === "confirmed").length,
    completed: (events as any[]).filter((e) => e.status === "completed").length,
  };

  function openCreate() {
    setEditingEvent(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(event: any) {
    setEditingEvent(event);
    setForm({
      clientId: String(event.clientId),
      eventName: event.eventName,
      eventType: event.eventType,
      eventDate: event.eventDate ? format(new Date(event.eventDate), "yyyy-MM-dd") : "",
      venueId: event.venueId ? String(event.venueId) : "",
      guestCount: event.guestCount ? String(event.guestCount) : "",
      budget: event.budget ? String(event.budget) : "",
      status: event.status,
    });
    setDialogOpen(true);
  }

  function handleClientChange(clientId: string) {
    setForm((f) => ({ ...f, clientId }));
    const client = (clients as any[]).find((c) => String(c.id) === clientId);
    if (!client) return;
    const updates: Partial<typeof form> = {};
    if (client.eventType && EVENT_TYPES.includes(client.eventType)) updates.eventType = client.eventType;
    if (client.guestCount) updates.guestCount = String(client.guestCount);
    if (client.eventDate) {
      try { updates.eventDate = format(new Date(client.eventDate), "yyyy-MM-dd"); } catch {}
    }
    if (client.budget) updates.budget = String(client.budget);
    if (client.venueId) updates.venueId = String(client.venueId);
    if (!form.eventName && client.name) updates.eventName = client.name;
    setForm((f) => ({ ...f, ...updates }));
  }

  async function handleSave() {
    if (!form.clientId || !form.eventName || !form.eventDate) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    const payload = {
      clientId: Number(form.clientId),
      eventName: form.eventName,
      eventType: form.eventType,
      eventDate: form.eventDate,
      venueId: form.venueId ? Number(form.venueId) : null,
      guestCount: form.guestCount ? Number(form.guestCount) : null,
      budget: form.budget || null,
      status: form.status,
    };
    try {
      if (editingEvent) {
        await updateEvent.mutateAsync({ id: editingEvent.id, ...payload });
        toast({ title: "Event updated" });
      } else {
        await createEvent.mutateAsync(payload);
        toast({ title: "Event created" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Failed to save event", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    await deleteEvent.mutateAsync(id);
    setConfirmDeleteId(null);
    toast({ title: "Event deleted" });
  }

  const getClient = (id: number) => (clients as any[]).find((c) => c.id === id);
  const getVenue = (id: number) => (venues as any[]).find((v) => v.id === id);

  const statusPills = [
    { key: "All", label: "All", count: stats.total },
    { key: "lead", label: "Leads", count: stats.lead },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "confirmed", label: "Confirmed", count: stats.confirmed },
    { key: "completed", label: "Completed", count: stats.completed },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h1>
            <p className="text-sm text-slate-500 mt-0.5">{stats.total} event{stats.total !== 1 ? "s" : ""} total · {stats.confirmed} confirmed</p>
          </div>
          <Button onClick={openCreate} data-testid="button-create-event" className="gap-2">
            <Plus className="w-4 h-4" /> New Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events",   value: stats.total,     color: "text-slate-700 dark:text-slate-200",   icon: CalendarDays },
            { label: "Leads",          value: stats.lead,      color: "text-amber-600 dark:text-amber-400",   icon: AlertCircle },
            { label: "Confirmed",      value: stats.confirmed, color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
            { label: "Completed",      value: stats.completed, color: "text-slate-400 dark:text-slate-500",   icon: Zap },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border border-slate-100 dark:border-slate-700 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg p-2 bg-slate-50 dark:bg-slate-800">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                    <p className={`text-2xl font-bold leading-none mt-0.5 ${s.color}`}>{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search + status pills */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search events, clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-events"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {statusPills.map((p) => (
              <button
                key={p.key}
                onClick={() => setStatusFilter(p.key)}
                data-testid={`filter-status-${p.key}`}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  statusFilter === p.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {p.label}
                <span className={`px-1.5 py-0 rounded-full text-[10px] font-bold ${statusFilter === p.key ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                  {p.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 font-semibold">No events found</p>
            <p className="text-slate-400 text-sm mt-1">
              {search || statusFilter !== "All" ? "Try adjusting your filters" : "Create your first event to get started"}
            </p>
            {!search && statusFilter === "All" && (
              <Button onClick={openCreate} className="mt-4 gap-2" size="sm">
                <Plus className="w-3.5 h-3.5" /> New Event
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered
              .sort((a: any, b: any) => {
                if (a.status === "completed" && b.status !== "completed") return 1;
                if (b.status === "completed" && a.status !== "completed") return -1;
                return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
              })
              .map((event) => {
                const client = getClient(event.clientId);
                const venue = event.venueId ? getVenue(event.venueId) : null;
                const sc = STATUS_CONFIG[event.status] || STATUS_CONFIG.lead;
                const StatusIcon = sc.icon;
                const emoji = EVENT_TYPE_EMOJI[event.eventType] || "📅";

                return (
                  <Card
                    key={event.id}
                    data-testid={`card-event-${event.id}`}
                    className={`border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow border-l-4 ${sc.borderColor}`}
                  >
                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-xl leading-none mt-0.5 shrink-0">{emoji}</span>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold truncate leading-snug">{event.eventName}</CardTitle>
                            <p className="text-[11px] text-slate-400 mt-0.5">{event.eventType}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${sc.badgeColor}`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {sc.label}
                          </Badge>
                          {event.eventDate && (
                            <CountdownBadge eventDate={event.eventDate} status={event.status} />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-1.5 pb-3">
                      {client && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Users className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="truncate">{client.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                        <span>{event.eventDate ? format(new Date(event.eventDate), "EEE, MMM d, yyyy") : "—"}</span>
                      </div>
                      {venue && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="truncate">{venue.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        {event.guestCount && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                            {event.guestCount} guests
                          </span>
                        )}
                        {event.budget && (
                          <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                            <DollarSign className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                            ${Number(event.budget).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs gap-1"
                          onClick={() => openEdit(event)}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-700"
                          onClick={() => setConfirmDeleteId(event.id)}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client *</label>
              <Select value={form.clientId} onValueChange={handleClientChange}>
                <SelectTrigger className="mt-1" data-testid="select-event-client">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {(clients as any[]).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Name *</label>
              <Input
                className="mt-1"
                placeholder="e.g. Johnson Wedding Reception"
                value={form.eventName}
                onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
                data-testid="input-event-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Type</label>
                <Select value={form.eventType} onValueChange={(v) => setForm((f) => ({ ...f, eventType: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{EVENT_TYPE_EMOJI[t] || "📅"} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Event Date *</label>
              <Input
                type="date"
                className="mt-1"
                value={form.eventDate}
                onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                data-testid="input-event-date"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Venue (optional)</label>
              <Select value={form.venueId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, venueId: v === "none" ? "" : v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No venue selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No venue</SelectItem>
                  {(venues as any[]).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Guest Count</label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="150"
                  value={form.guestCount}
                  onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
                  data-testid="input-event-guests"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Budget ($)</label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="10000"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  data-testid="input-event-budget"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createEvent.isPending || updateEvent.isPending}
              data-testid="button-save-event"
            >
              {editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Event?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              data-testid="button-confirm-delete-event"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
