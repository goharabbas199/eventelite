import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useEvents } from "@/hooks/use-events";
import { useClients } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, CalendarDays, Users, MapPin, DollarSign, Zap,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, addMonths, subMonths, isToday, differenceInDays,
} from "date-fns";
import { useVenues } from "@/hooks/use-venues";
import { useLocation } from "wouter";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; textColor: string }> = {
  lead:      { label: "Lead",      color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",        dot: "bg-amber-400",   textColor: "text-amber-600" },
  pending:   { label: "Pending",   color: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",            dot: "bg-blue-500",    textColor: "text-blue-600" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", textColor: "text-emerald-600" },
  completed: { label: "Completed", color: "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300",        dot: "bg-slate-400",   textColor: "text-slate-500" },
};

const EVENT_EMOJI: Record<string, string> = {
  Wedding: "💍",
  Corporate: "🏢",
  Birthday: "🎂",
  Engagement: "💐",
  Conference: "🎤",
  Gala: "✨",
  Other: "📅",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const { data: events = [] } = useEvents();
  const { data: clients = [] } = useClients();
  const { data: venues = [] } = useVenues();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [, navigate] = useLocation();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  function getEventsForDay(day: Date) {
    return (events as any[]).filter((e) => {
      if (!e.eventDate) return false;
      return isSameDay(new Date(e.eventDate), day);
    });
  }

  const getClient = (id: number) => (clients as any[]).find((c) => c.id === id);
  const getVenue = (id: number) => (venues as any[]).find((v) => v.id === id);

  const eventsThisMonth = (events as any[]).filter((e) => {
    if (!e.eventDate) return false;
    const d = new Date(e.eventDate);
    return d >= monthStart && d <= monthEnd;
  }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const upcomingOverall = (events as any[])
    .filter((e) => e.eventDate && new Date(e.eventDate) > new Date() && e.status !== "completed")
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 3);

  return (
    <Layout title="Calendar">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Schedule</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Calendar</h2>
            <p className="text-sm text-slate-500 mt-0.5 hidden sm:block">
              {eventsThisMonth.length === 0
                ? "No events this month"
                : `${eventsThisMonth.length} event${eventsThisMonth.length !== 1 ? "s" : ""} in ${format(currentMonth, "MMMM")}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="button-prev-month">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[110px] sm:min-w-[140px] text-center px-1">
              {format(currentMonth, "MMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="button-next-month">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} data-testid="button-today">
              Today
            </Button>
          </div>
        </div>

        {/* Legend — desktop only */}
        <div className="hidden sm:flex flex-wrap gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-slate-500">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid — desktop only (too cramped on mobile) */}
        <Card className="hidden sm:block border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[108px] border-b border-r border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20" />
              ))}
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const today = isToday(day);
                const isLastCol = (startPad + idx + 1) % 7 === 0;
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[108px] p-1.5 border-b ${isLastCol ? "" : "border-r"} border-slate-100 dark:border-slate-800 ${today ? "bg-indigo-50/70 dark:bg-indigo-950/20" : ""}`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1.5 ${
                      today
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => {
                        const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.lead;
                        const emoji = EVENT_EMOJI[event.eventType] || "📅";
                        return (
                          <button
                            key={event.id}
                            data-testid={`calendar-event-${event.id}`}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left text-[9px] font-semibold px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${cfg.color} hover:opacity-80 transition-opacity`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                            <span className="truncate">{event.eventName}</span>
                          </button>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <button
                          onClick={() => setSelectedEvent(dayEvents[2])}
                          className="text-[9px] text-indigo-500 pl-1 font-medium hover:underline"
                        >
                          +{dayEvents.length - 2} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events this month list */}
        {eventsThisMonth.length > 0 ? (
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {format(currentMonth, "MMMM")} Schedule
            </h2>
            <div className="space-y-2">
              {eventsThisMonth.map((event) => {
                const client = getClient(event.clientId);
                const venue = event.venueId ? getVenue(event.venueId) : null;
                const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.lead;
                const emoji = EVENT_EMOJI[event.eventType] || "📅";
                const daysLeft = differenceInDays(new Date(event.eventDate), new Date());
                return (
                  <div
                    key={event.id}
                    data-testid={`list-event-${event.id}`}
                    onClick={() => setSelectedEvent(event)}
                    className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer transition-all hover:shadow-sm"
                  >
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {format(new Date(event.eventDate), "MMM")}
                      </p>
                      <p className="text-xl font-black text-slate-700 dark:text-slate-100 leading-none">
                        {format(new Date(event.eventDate), "d")}
                      </p>
                    </div>
                    <div className="text-xl shrink-0">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">{event.eventName}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {event.eventType}
                        {client ? ` · ${client.name}` : ""}
                        {venue ? ` · ${venue.name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {daysLeft > 0 && event.status !== "completed" && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          daysLeft <= 7 ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400" :
                          daysLeft <= 14 ? "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" :
                          "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                        }`}>
                          {daysLeft === 0 ? "Today" : `${daysLeft}d`}
                        </span>
                      )}
                      <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-12 text-center">
            <CalendarDays className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No events in {format(currentMonth, "MMMM yyyy")}</p>
            <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Navigate to another month or create new events</p>
            {upcomingOverall.length > 0 && (
              <div className="mt-6 text-left max-w-sm mx-auto px-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Next upcoming events</p>
                {upcomingOverall.map((e) => {
                  const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.lead;
                  const daysLeft = differenceInDays(new Date(e.eventDate), new Date());
                  return (
                    <div
                      key={e.id}
                      onClick={() => {
                        setCurrentMonth(new Date(e.eventDate));
                        setSelectedEvent(e);
                      }}
                      className="flex items-center gap-3 py-2 cursor-pointer group"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors truncate">{e.eventName}</p>
                        <p className="text-xs text-slate-400">{format(new Date(e.eventDate), "MMM d, yyyy")}</p>
                      </div>
                      <span className="text-xs text-slate-400">{daysLeft}d away</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{EVENT_EMOJI[selectedEvent.eventType] || "📅"}</span>
                <span className="truncate">{selectedEvent.eventName}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-1">
              <Badge className={`text-xs ${(STATUS_CONFIG[selectedEvent.status] || STATUS_CONFIG.lead).color}`}>
                {(STATUS_CONFIG[selectedEvent.status] || STATUS_CONFIG.lead).label}
              </Badge>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{format(new Date(selectedEvent.eventDate), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <Zap className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{selectedEvent.eventType}</span>
                </div>
                {getClient(selectedEvent.clientId) && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{getClient(selectedEvent.clientId)?.name}</span>
                  </div>
                )}
                {selectedEvent.venueId && getVenue(selectedEvent.venueId) && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{getVenue(selectedEvent.venueId)?.name}</span>
                  </div>
                )}
                {selectedEvent.guestCount && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedEvent.guestCount} guests</span>
                  </div>
                )}
                {selectedEvent.budget && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>${Number(selectedEvent.budget).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {selectedEvent.status !== "completed" && selectedEvent.eventDate && (() => {
                const days = differenceInDays(new Date(selectedEvent.eventDate), new Date());
                if (days < 0) return null;
                return (
                  <div className={`rounded-lg p-3 text-center ${
                    days <= 3 ? "bg-red-50 dark:bg-red-950/30" :
                    days <= 14 ? "bg-amber-50 dark:bg-amber-950/30" :
                    "bg-slate-50 dark:bg-slate-800/50"
                  }`}>
                    <p className={`text-2xl font-black ${
                      days <= 3 ? "text-red-600" : days <= 14 ? "text-amber-600" : "text-slate-600 dark:text-slate-300"
                    }`}>{days === 0 ? "TODAY" : `${days}`}</p>
                    {days > 0 && <p className="text-xs text-slate-400 mt-0.5">days until event</p>}
                  </div>
                );
              })()}
              <Button
                className="w-full gap-2"
                variant="outline"
                size="sm"
                onClick={() => { setSelectedEvent(null); navigate("/events"); }}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Manage in Events
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
