import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useClients } from "@/hooks/use-clients";
import { useVenues } from "@/hooks/use-venues";
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
  Search, Edit2, CheckCircle, Clock, Zap, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Engagement", "Conference", "Gala", "Other"];
const EVENT_STATUSES = ["lead", "pending", "confirmed", "completed"];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  lead:      { label: "Lead",      color: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",   icon: AlertCircle },
  pending:   { label: "Pending",   color: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",       icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300",   icon: Zap },
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

export default function Events() {
  const { data: events = [], isLoading } = useEvents();
  const { data: clients = [] } = useClients();
  const { data: venues = [] } = useVenues();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage all your events in one place</p>
          </div>
          <Button onClick={openCreate} data-testid="button-create-event" className="gap-2">
            <Plus className="w-4 h-4" /> New Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total, color: "text-slate-700 dark:text-slate-200" },
            { label: "Leads", value: stats.lead, color: "text-amber-600" },
            { label: "Confirmed", value: stats.confirmed, color: "text-emerald-600" },
            { label: "Completed", value: stats.completed, color: "text-slate-500" },
          ].map((s) => (
            <Card key={s.label} className="border border-slate-100 dark:border-slate-700 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-events"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {EVENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Event Cards */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No events found</p>
            <p className="text-slate-300 dark:text-slate-600 text-sm mt-1">Create your first event to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((event) => {
              const client = getClient(event.clientId);
              const venue = event.venueId ? getVenue(event.venueId) : null;
              const sc = STATUS_CONFIG[event.status] || STATUS_CONFIG.lead;
              const StatusIcon = sc.icon;
              return (
                <Card
                  key={event.id}
                  data-testid={`card-event-${event.id}`}
                  className="border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{event.eventName}</CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5">{event.eventType}</p>
                      </div>
                      <Badge className={`text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0 ${sc.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {sc.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {client && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{event.eventDate ? format(new Date(event.eventDate), "MMM dd, yyyy") : "—"}</span>
                    </div>
                    {venue && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{venue.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      {event.guestCount && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {event.guestCount} guests
                        </span>
                      )}
                      {event.budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          ${Number(event.budget).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
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
                        className="h-7 text-xs text-red-500 hover:text-red-600 hover:border-red-300"
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
                    {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
