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
  ChevronLeft, ChevronRight, CalendarDays, Users, MapPin, DollarSign,
  CheckCircle, Clock, AlertCircle, Zap,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { useVenues } from "@/hooks/use-venues";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  lead:      { label: "Lead",      color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300",       dot: "bg-amber-400" },
  pending:   { label: "Pending",   color: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300",           dot: "bg-blue-500" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  completed: { label: "Completed", color: "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300",       dot: "bg-slate-400" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const { data: events = [] } = useEvents();
  const { data: clients = [] } = useClients();
  const { data: venues = [] } = useVenues();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

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

  function getClient(id: number) {
    return (clients as any[]).find((c) => c.id === id);
  }

  function getVenue(id: number) {
    return (venues as any[]).find((v) => v.id === id);
  }

  const totalThisMonth = (events as any[]).filter((e) => {
    if (!e.eventDate) return false;
    const d = new Date(e.eventDate);
    return d >= monthStart && d <= monthEnd;
  }).length;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Event Calendar</h1>
            <p className="text-sm text-slate-500 mt-0.5">{totalThisMonth} event{totalThisMonth !== 1 ? "s" : ""} this month</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} data-testid="button-prev-month">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} data-testid="button-next-month">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} data-testid="button-today">
              Today
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-slate-500">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <Card className="border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {/* Leading blank cells */}
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" />
              ))}
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const today = isToday(day);
                const isLastCol = (startPad + idx + 1) % 7 === 0;
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[100px] p-1.5 border-b ${isLastCol ? "" : "border-r"} border-slate-100 dark:border-slate-800 ${today ? "bg-indigo-50/60 dark:bg-indigo-950/20" : ""}`}
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${today ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-slate-400"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => {
                        const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.lead;
                        return (
                          <button
                            key={event.id}
                            data-testid={`calendar-event-${event.id}`}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left text-[9px] font-semibold px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${cfg.color} hover:opacity-80 transition-opacity`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                            {event.eventName}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[9px] text-slate-400 pl-1">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events List */}
        {totalThisMonth > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Events This Month
            </h2>
            <div className="space-y-2">
              {(events as any[])
                .filter((e) => {
                  if (!e.eventDate) return false;
                  const d = new Date(e.eventDate);
                  return d >= monthStart && d <= monthEnd;
                })
                .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                .map((event) => {
                  const client = getClient(event.clientId);
                  const venue = event.venueId ? getVenue(event.venueId) : null;
                  const cfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.lead;
                  return (
                    <div
                      key={event.id}
                      data-testid={`list-event-${event.id}`}
                      onClick={() => setSelectedEvent(event)}
                      className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer transition-colors"
                    >
                      <div className="text-center w-12 shrink-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {format(new Date(event.eventDate), "MMM")}
                        </p>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-200 leading-none">
                          {format(new Date(event.eventDate), "d")}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{event.eventName}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {event.eventType}{client ? ` · ${client.name}` : ""}{venue ? ` · ${venue.name}` : ""}
                        </p>
                      </div>
                      <Badge className={`text-[10px] shrink-0 ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="truncate">{selectedEvent.eventName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <Badge className={`text-xs ${(STATUS_CONFIG[selectedEvent.status] || STATUS_CONFIG.lead).color}`}>
                {(STATUS_CONFIG[selectedEvent.status] || STATUS_CONFIG.lead).label}
              </Badge>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span>{format(new Date(selectedEvent.eventDate), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Zap className="w-4 h-4 text-slate-400" />
                  <span>{selectedEvent.eventType}</span>
                </div>
                {getClient(selectedEvent.clientId) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{getClient(selectedEvent.clientId)?.name}</span>
                  </div>
                )}
                {selectedEvent.venueId && getVenue(selectedEvent.venueId) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{getVenue(selectedEvent.venueId)?.name}</span>
                  </div>
                )}
                {selectedEvent.guestCount && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{selectedEvent.guestCount} guests</span>
                  </div>
                )}
                {selectedEvent.budget && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span>${Number(selectedEvent.budget).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
