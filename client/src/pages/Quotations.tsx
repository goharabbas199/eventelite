import { useState, useMemo, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useClients, useCreatePlannedService } from "@/hooks/use-clients";
import { useVenues } from "@/hooks/use-venues";
import { useVendors, useVendor } from "@/hooks/use-vendors";
import { useQuotations, useCreateQuotation, useUpdateQuotation, useDeleteQuotation } from "@/hooks/use-quotations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Trash2, FileText, Printer, Send, CheckCircle,
  TrendingUp, Clock, Save, ArrowRight, ReceiptText, Users,
  Wand2, Building2, ShoppingBag, Calendar, X, AlertCircle,
  DollarSign, Star, Phone, Mail, Sparkles, ChevronRight,
  CircleDollarSign, Target, Zap, Search, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { chip: string; dot: string; bar: string }> = {
  Draft:    { chip: "bg-slate-100 text-slate-600",     dot: "bg-slate-400",    bar: "bg-slate-300" },
  Sent:     { chip: "bg-blue-100 text-blue-700",       dot: "bg-blue-500",     bar: "bg-blue-400" },
  Accepted: { chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500",  bar: "bg-emerald-500" },
  Rejected: { chip: "bg-red-100 text-red-600",         dot: "bg-red-400",      bar: "bg-red-400" },
};

const CLIENT_STATUS_STYLES: Record<string, string> = {
  Lead:      "bg-amber-100 text-amber-700",
  Confirmed: "bg-emerald-100 text-emerald-700",
  Completed: "bg-slate-100 text-slate-600",
  Cancelled: "bg-red-100 text-red-600",
};

const STATUSES = ["Draft", "Sent", "Accepted", "Rejected"];
const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Engagement", "Conference", "Gala", "Other"];

const SERVICE_TEMPLATES: Record<string, { name: string; hint: string }[]> = {
  Wedding:    [
    { name: "Catering", hint: "Per-person dining" },
    { name: "Photography", hint: "Full day coverage" },
    { name: "DJ / Entertainment", hint: "Evening entertainment" },
    { name: "Decoration", hint: "Venue styling" },
    { name: "Lighting", hint: "Ambient & stage" },
    { name: "Flowers & Floral", hint: "Bouquets & arrangements" },
  ],
  Corporate:  [
    { name: "AV Equipment", hint: "Screens, mics, sound" },
    { name: "Catering", hint: "Meals & refreshments" },
    { name: "Branding", hint: "Signage & displays" },
    { name: "Host / Emcee", hint: "MC & facilitation" },
    { name: "Photography", hint: "Event coverage" },
  ],
  Birthday:   [
    { name: "Catering", hint: "Food & beverages" },
    { name: "Decoration", hint: "Theming & styling" },
    { name: "DJ / Entertainment", hint: "Music & games" },
    { name: "Photography", hint: "Event coverage" },
    { name: "Cake", hint: "Custom cake" },
  ],
  Engagement: [
    { name: "Decoration", hint: "Styling & setup" },
    { name: "Photography", hint: "Couple coverage" },
    { name: "Catering", hint: "Dining & drinks" },
    { name: "Flowers & Floral", hint: "Arrangements" },
  ],
  Conference: [
    { name: "AV Equipment", hint: "Tech setup" },
    { name: "Catering", hint: "Meals & refreshments" },
    { name: "Branding", hint: "Signage & displays" },
    { name: "Host / Emcee", hint: "Facilitation" },
  ],
  Gala:       [
    { name: "Catering", hint: "Fine dining" },
    { name: "DJ / Entertainment", hint: "Band or DJ" },
    { name: "Decoration", hint: "Premium styling" },
    { name: "Lighting", hint: "Atmospheric lighting" },
    { name: "Photography", hint: "Event coverage" },
  ],
  Other:      [
    { name: "Catering", hint: "Food & beverages" },
    { name: "Decoration", hint: "Styling" },
    { name: "Photography", hint: "Coverage" },
  ],
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtFull(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── types ────────────────────────────────────────────────────────────────────

type LineItem = {
  id: string;
  serviceName: string;
  cost: string;
  tag?: "venue" | "vendor";
  vendorId?: number;
};

// ─── sub-components ───────────────────────────────────────────────────────────

function ClientCard({ client, budget, finalPrice }: { client: any; budget: number; finalPrice: number }) {
  const pct = budget > 0 ? Math.min((finalPrice / budget) * 100, 100) : 0;
  const over = finalPrice > budget && budget > 0;
  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-slate-50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">{initials(client.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm truncate">{client.name}</span>
            <Badge className={`text-[9px] px-1.5 py-0 ${CLIENT_STATUS_STYLES[client.status] || "bg-slate-100 text-slate-600"}`}>
              {client.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Mail className="w-2.5 h-2.5" />{client.email}
          </p>
          {client.phone && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Phone className="w-2.5 h-2.5" />{client.phone}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-white rounded-lg p-2">
          <p className="text-[10px] text-slate-400 font-medium">Budget</p>
          <p className="text-xs font-bold text-slate-700">{fmt(Number(client.budget) || 0)}</p>
        </div>
        <div className="bg-white rounded-lg p-2">
          <p className="text-[10px] text-slate-400 font-medium">Event</p>
          <p className="text-xs font-bold text-slate-700 truncate">{client.eventType?.split(" ")[0] || "—"}</p>
        </div>
        <div className="bg-white rounded-lg p-2">
          <p className="text-[10px] text-slate-400 font-medium">Guests</p>
          <p className="text-xs font-bold text-slate-700">{client.guestCount || "—"}</p>
        </div>
      </div>
      {budget > 0 && (
        <div>
          <div className="flex justify-between text-[10px] font-semibold mb-1">
            <span className="text-slate-500">Quote vs Budget</span>
            <span className={over ? "text-red-500" : "text-emerald-600"}>
              {fmtFull(finalPrice)} / {fmtFull(budget)}{" "}
              {over ? "⚠ Over budget" : "✓ Within budget"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-400" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateBanner({ eventType, onApply, onDismiss }: { eventType: string; onApply: () => void; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
      <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-indigo-800">
          Smart suggestion: {eventType} template ready
        </p>
        <p className="text-[10px] text-indigo-500">
          {SERVICE_TEMPLATES[eventType]?.length || 0} pre-configured services — apply in one click
        </p>
      </div>
      <Button size="sm" onClick={onApply}
        className="h-6 text-[10px] rounded-lg bg-indigo-600 hover:bg-indigo-700 px-2.5 shrink-0">
        Apply
      </Button>
      <button onClick={onDismiss} className="text-indigo-300 hover:text-indigo-500">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Quotations() {
  const { data: clients = [] } = useClients();
  const { data: venues = [] } = useVenues();
  const { data: vendors = [] } = useVendors();
  const { data: quotations = [], isLoading } = useQuotations();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const deleteQuotation = useDeleteQuotation();
  const createService = useCreatePlannedService();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const printRef = useRef<HTMLDivElement>(null);

  // dialog/UI state
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [showTemplateBanner, setShowTemplateBanner] = useState(false);
  const [templateDismissed, setTemplateDismissed] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>("All");

  // form state
  const [clientId, setClientId] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [venueId, setVenueId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ id: uid(), serviceName: "", cost: "" }]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [markup, setMarkup] = useState("20");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Draft");

  // vendor quick-add
  const [quickVendorId, setQuickVendorId] = useState("");
  const [quickProductId, setQuickProductId] = useState("");
  const [quickPerGuest, setQuickPerGuest] = useState(false);
  const { data: quickVendorData } = useVendor(quickVendorId ? Number(quickVendorId) : 0);

  // derived
  const selectedClient = (clients as any[]).find((c) => String(c.id) === clientId);
  const selectedVenue  = (venues  as any[]).find((v) => String(v.id) === venueId);
  const quickProducts  = quickVendorData?.products ?? [];

  // ── auto-template banner ──
  useEffect(() => {
    const hasRealItems = items.some((i) => i.serviceName.trim() && !i.tag);
    if (!hasRealItems && !templateDismissed) {
      setShowTemplateBanner(true);
    } else {
      setShowTemplateBanner(false);
    }
  }, [eventType]);

  // ── PIPELINE STATS ────────────────────────────────────────────────────────
  const pipelineStats = useMemo(() => {
    const qs = quotations as any[];
    const total = qs.length;
    const totalValue = qs.reduce((s, q) => s + (Number(q.finalPrice) || 0), 0);
    const accepted = qs.filter((q) => q.status === "Accepted").length;
    const pending = qs.filter((q) => q.status === "Sent").length;
    const drafts = qs.filter((q) => q.status === "Draft").length;
    const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, totalValue, accepted, pending, drafts, acceptRate };
  }, [quotations]);

  // ── FILTERED QUOTES ───────────────────────────────────────────────────────
  const filteredQuotations = useMemo(() => {
    return (quotations as any[]).filter((q) => {
      const client = (clients as any[]).find((c) => c.id === q.clientId);
      const searchTarget = `${client?.name || ""} ${q.eventType || ""}`.toLowerCase();
      const matchesSearch = !quoteSearch || searchTarget.includes(quoteSearch.toLowerCase());
      const matchesStatus = quoteStatusFilter === "All" || q.status === quoteStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, clients, quoteSearch, quoteStatusFilter]);

  // ── CALCULATIONS ──────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const totalCost   = items.reduce((s, it) => s + (Number(it.cost) || 0), 0);
    const discountAmt = totalCost * (Number(discount) / 100);
    const afterDisc   = totalCost - discountAmt;
    const taxAmt      = afterDisc * (Number(tax) / 100);
    const markupAmt   = afterDisc * (Number(markup) / 100);
    const finalPrice  = afterDisc + taxAmt + markupAmt;
    const profit      = finalPrice - totalCost;
    const margin      = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
    const guests      = Number(guestCount) || 0;
    const perGuest    = guests > 0 ? finalPrice / guests : 0;
    return { totalCost, discountAmt, afterDisc, taxAmt, markupAmt, finalPrice, profit, margin, perGuest };
  }, [items, discount, tax, markup, guestCount]);

  // ── COMPLETENESS SCORE ────────────────────────────────────────────────────
  const completeness = useMemo(() => {
    const checks = [
      { label: "Client selected",     done: !!clientId },
      { label: "Event type set",      done: !!eventType },
      { label: "Guest count added",   done: !!guestCount },
      { label: "At least 1 service",  done: items.some((i) => i.serviceName.trim()) },
      { label: "All costs filled",    done: items.filter((i) => i.serviceName.trim()).every((i) => Number(i.cost) > 0) },
      { label: "Markup configured",   done: Number(markup) > 0 },
    ];
    const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
    return { checks, score };
  }, [clientId, eventType, guestCount, items, markup]);

  // ── CLIENT AUTO-FILL ──────────────────────────────────────────────────────
  function handleClientChange(newId: string) {
    setClientId(newId);
    const c = (clients as any[]).find((x) => String(x.id) === newId);
    if (!c) return;
    if (c.eventType && EVENT_TYPES.some((e) => c.eventType?.includes(e))) {
      const matched = EVENT_TYPES.find((e) => c.eventType?.includes(e)) || eventType;
      setEventType(matched);
    }
    if (c.guestCount) setGuestCount(String(c.guestCount));
    if (c.eventDate) {
      try { setEventDate(format(new Date(c.eventDate), "yyyy-MM-dd")); } catch {}
    }
    setTemplateDismissed(false);
  }

  // ── VENUE AUTO-FILL ───────────────────────────────────────────────────────
  function handleVenueChange(newVenueId: string) {
    setVenueId(newVenueId);
    setItems((prev) => prev.filter((i) => i.tag !== "venue"));
    if (!newVenueId || newVenueId === "none") return;
    const v = (venues as any[]).find((x) => String(x.id) === newVenueId);
    if (!v) return;
    setItems((prev) => [{
      id: uid(),
      serviceName: `Venue — ${v.name}`,
      cost: String(Number(v.basePrice)),
      tag: "venue",
    }, ...prev]);
  }

  // ── EVENT TYPE CHANGE ─────────────────────────────────────────────────────
  function handleEventTypeChange(t: string) {
    setEventType(t);
    setTemplateDismissed(false);
    setShowTemplateBanner(true);
  }

  // ── APPLY TEMPLATE ────────────────────────────────────────────────────────
  function applyTemplate() {
    const tpl = SERVICE_TEMPLATES[eventType] || [];
    const venueItem = items.find((i) => i.tag === "venue");
    setItems([
      ...(venueItem ? [venueItem] : []),
      ...tpl.map((t) => ({ id: uid(), serviceName: t.name, cost: "" })),
    ]);
    setShowTemplateBanner(false);
    setTemplateDismissed(true);
    toast({ title: `${eventType} template applied`, description: `${tpl.length} services added — fill in the costs` });
  }

  // ── VENDOR QUICK-ADD ──────────────────────────────────────────────────────
  function addVendorService() {
    if (!quickVendorId || !quickProductId) return;
    const p = quickProducts.find((x: any) => String(x.id) === quickProductId);
    if (!p) return;
    const guests    = Number(guestCount) || 1;
    const basePrice = Number(p.price) || 0;
    const cost      = quickPerGuest ? basePrice * guests : basePrice;
    setItems((prev) => [...prev, {
      id: uid(), serviceName: p.name, cost: String(cost),
      tag: "vendor", vendorId: Number(quickVendorId),
    }]);
    setQuickProductId("");
    setQuickPerGuest(false);
    const vendorName = (vendors as any[]).find((v) => String(v.id) === quickVendorId)?.name;
    toast({ title: `${p.name} added`, description: `${fmtFull(cost)}${vendorName ? ` from ${vendorName}` : ""}` });
  }

  // ── ITEM MANAGEMENT ───────────────────────────────────────────────────────
  function addItem() {
    setItems((p) => [...p, { id: uid(), serviceName: "", cost: "" }]);
  }
  function removeItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (item?.tag === "venue") setVenueId("");
    setItems((p) => {
      const next = p.filter((i) => i.id !== id);
      return next.length === 0 ? [{ id: uid(), serviceName: "", cost: "" }] : next;
    });
  }
  function updateItem(id: string, field: "serviceName" | "cost", value: string) {
    setItems((p) => p.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  // ── RESET ─────────────────────────────────────────────────────────────────
  function resetForm() {
    setClientId(""); setEventType("Wedding"); setEventDate(""); setGuestCount("");
    setVenueId(""); setItems([{ id: uid(), serviceName: "", cost: "" }]);
    setDiscount("0"); setTax("0"); setMarkup("20"); setNotes(""); setStatus("Draft");
    setSelectedQuoteId(null); setQuickVendorId(""); setQuickProductId("");
    setShowTemplateBanner(false); setTemplateDismissed(false);
  }

  // ── LOAD QUOTE ────────────────────────────────────────────────────────────
  function loadQuote(q: any) {
    setSelectedQuoteId(q.id);
    setClientId(q.clientId ? String(q.clientId) : "");
    setEventType(q.eventType || "Wedding");
    setGuestCount(q.guestCount ? String(q.guestCount) : "");
    setVenueId(q.venueId ? String(q.venueId) : "");
    setItems((q.items || []).length > 0
      ? q.items.map((i: any) => ({ id: uid(), serviceName: i.serviceName, cost: String(i.cost) }))
      : [{ id: uid(), serviceName: "", cost: "" }]);
    setDiscount(q.discount || "0");
    setTax(q.tax || "0");
    setMarkup(q.markupPercentage || "20");
    setNotes(q.notes || "");
    setStatus(q.status || "Draft");
    setQuickVendorId(""); setQuickProductId("");
    setShowTemplateBanner(false); setTemplateDismissed(true);
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    const payload = {
      clientId: clientId ? Number(clientId) : null,
      eventType, guestCount: guestCount ? Number(guestCount) : null,
      venueId: venueId && venueId !== "none" ? Number(venueId) : null,
      totalCost: calc.totalCost, markupPercentage: Number(markup),
      discount: Number(discount), tax: Number(tax),
      finalPrice: calc.finalPrice, status, notes: notes || null,
      items: items.filter((i) => i.serviceName.trim()).map((i) => ({
        serviceName: i.serviceName, cost: Number(i.cost) || 0,
      })),
    };
    try {
      if (selectedQuoteId) {
        await updateQuotation.mutateAsync({ id: selectedQuoteId, ...payload });
        toast({ title: "Quote updated successfully" });
      } else {
        const created = await createQuotation.mutateAsync(payload);
        setSelectedQuoteId(created.id);
        toast({ title: "Quote saved", description: "You can now mark it as sent or convert to event" });
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }

  // ── STATUS ────────────────────────────────────────────────────────────────
  async function handleStatusChange(newStatus: string) {
    if (!selectedQuoteId) { toast({ title: "Save the quote first", variant: "destructive" }); return; }
    await updateQuotation.mutateAsync({ id: selectedQuoteId, status: newStatus });
    setStatus(newStatus);
    toast({ title: `Status updated to ${newStatus}` });
  }

  // ── CONVERT ───────────────────────────────────────────────────────────────
  async function handleConvertToEvent() {
    if (!selectedClient) { toast({ title: "Select a client first", variant: "destructive" }); return; }
    try {
      if (selectedQuoteId) await updateQuotation.mutateAsync({ id: selectedQuoteId, status: "Accepted" });
      const services = items.filter((i) => i.serviceName.trim());
      await Promise.all(services.map((i) =>
        createService.mutateAsync({
          clientId: Number(clientId), serviceName: i.serviceName,
          cost: Number(i.cost) || 0, status: "Planned", vendorId: i.vendorId ?? null,
        } as any)
      ));
      toast({ title: "Event created!", description: `${services.length} service(s) added to ${selectedClient.name}` });
      setConvertDialogOpen(false);
      navigate(`/clients/${clientId}`);
    } catch {
      toast({ title: "Conversion failed", variant: "destructive" });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    await deleteQuotation.mutateAsync(id);
    if (selectedQuoteId === id) resetForm();
    setConfirmDeleteId(null);
    toast({ title: "Quote deleted" });
  }

  const isPending = createQuotation.isPending || updateQuotation.isPending;
  const missingCostCount = items.filter((i) => i.serviceName.trim() && !Number(i.cost)).length;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #quote-preview, #quote-preview * { visibility: visible !important; }
          #quote-preview {
            position: fixed; top: 0; left: 0; width: 100vw;
            padding: 48px; background: white;
          }
        }
      `}</style>

      <Layout title="Quotation Builder">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Sales</p>
            <h2 className="text-xl font-bold text-slate-900">Quotation Builder</h2>
            <p className="text-xs text-slate-400 mt-0.5">Build, price and send professional event quotes</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedQuoteId && (
              <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-lg">
                Quote #{String(selectedQuoteId).padStart(4, "0")}
              </span>
            )}
            <Button onClick={resetForm} variant="outline" className="h-9 rounded-xl text-xs" data-testid="button-new-quote">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Quote
            </Button>
          </div>
        </div>

        {/* ── Pipeline KPI bar ── */}
        {(quotations as any[]).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Pipeline",
                value: fmt(pipelineStats.totalValue),
                sub: `${pipelineStats.total} quote${pipelineStats.total !== 1 ? "s" : ""}`,
                icon: CircleDollarSign,
                cls: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Acceptance Rate",
                value: `${pipelineStats.acceptRate}%`,
                sub: `${pipelineStats.accepted} accepted`,
                icon: CheckCircle,
                cls: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Awaiting Response",
                value: String(pipelineStats.pending),
                sub: "quotes sent",
                icon: Send,
                cls: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Drafts",
                value: String(pipelineStats.drafts),
                sub: "in progress",
                icon: Clock,
                cls: "text-slate-600",
                bg: "bg-slate-100",
              },
            ].map(({ label, value, sub, icon: Icon, cls, bg }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                  <div className={`p-1.5 rounded-lg ${bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cls}`} />
                  </div>
                </div>
                <p className={`text-xl font-bold ${cls}`}>{value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Completeness progress bar ── */}
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2 shrink-0">
            <Target className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Quote completeness</span>
          </div>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completeness.score === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-indigo-400"
              }`}
              style={{ width: `${completeness.score}%` }}
            />
          </div>
          <span className={`text-xs font-bold shrink-0 ${completeness.score === 100 ? "text-emerald-600" : "text-slate-500"}`}>
            {completeness.score}%
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ═══════════════════════════════════════════════════════════════
              LEFT — Builder + Preview
          ═══════════════════════════════════════════════════════════════ */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* ── CARD 1: Client & Event ── */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-base">Client & Event Details</CardTitle>
                  {selectedQuoteId && (
                    <div className="ml-auto flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[status]?.dot}`} />
                      <span className="text-xs font-semibold text-slate-600">{status}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">

                {/* Client selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Client
                    <span className="text-slate-400 font-normal ml-1.5">— auto-fills event info</span>
                  </label>
                  <Select value={clientId} onValueChange={handleClientChange}>
                    <SelectTrigger className="h-9 rounded-xl text-sm" data-testid="select-client">
                      <SelectValue placeholder="Search and select a client…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(clients as any[]).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          <span className="font-medium">{c.name}</span>
                          <span className="text-slate-400 ml-2 text-xs">{c.eventType}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClient && (
                  <ClientCard
                    client={selectedClient}
                    budget={Number(selectedClient.budget) || 0}
                    finalPrice={calc.finalPrice}
                  />
                )}

                {/* Grid: Event Type / Guest Count / Date / Venue */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Event Type</label>
                    <Select value={eventType} onValueChange={handleEventTypeChange}>
                      <SelectTrigger className="h-9 rounded-xl text-sm" data-testid="select-event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Guest Count</label>
                    <Input
                      type="number" placeholder="e.g. 150" value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="h-9 rounded-xl text-sm" data-testid="input-guest-count"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Event Date</label>
                    <Input
                      type="date" value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-9 rounded-xl text-sm" data-testid="input-event-date"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                      Venue
                      <span className="text-slate-400 font-normal text-[10px] ml-1">→ auto line item</span>
                    </label>
                    <Select value={venueId || "none"} onValueChange={handleVenueChange}>
                      <SelectTrigger className="h-9 rounded-xl text-sm" data-testid="select-venue">
                        <SelectValue placeholder="Select venue…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No venue</SelectItem>
                        {(venues as any[]).map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name} — {fmtFull(Number(v.basePrice))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── CARD 2: Services ── */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <ReceiptText className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <CardTitle className="text-base">Services & Pricing</CardTitle>
                    {missingCostCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-2.5 h-2.5" /> {missingCostCount} cost{missingCostCount > 1 ? "s" : ""} missing
                      </span>
                    )}
                  </div>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    data-testid="button-add-line-item"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add line
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">

                {showTemplateBanner && (
                  <TemplateBanner
                    eventType={eventType}
                    onApply={applyTemplate}
                    onDismiss={() => { setShowTemplateBanner(false); setTemplateDismissed(true); }}
                  />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm" onClick={applyTemplate}
                    className="h-7 rounded-lg text-[11px] border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    data-testid="button-apply-template"
                  >
                    <Wand2 className="w-3 h-3 mr-1" /> Auto-fill {eventType} services
                  </Button>
                  <span className="text-[10px] text-slate-400">
                    {SERVICE_TEMPLATES[eventType]?.length} services suggested
                  </span>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 pb-1 border-b border-slate-100">
                  <div className="col-span-1" />
                  <div className="col-span-7">Service / Description</div>
                  <div className="col-span-3 text-right pr-2">Cost ($)</div>
                  <div className="col-span-1" />
                </div>

                {/* Line items */}
                <div className="space-y-1.5">
                  {items.map((item, idx) => {
                    const hasName = item.serviceName.trim();
                    const hasCost = Number(item.cost) > 0;
                    const warnRow = hasName && !hasCost;
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-2 items-center rounded-xl px-2 py-1 group transition-colors ${
                          item.tag === "venue"  ? "bg-blue-50/70 border border-blue-100" :
                          item.tag === "vendor" ? "bg-purple-50/50 border border-purple-100" :
                          warnRow               ? "bg-amber-50/60 border border-amber-100" :
                          "hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="shrink-0 w-5 flex justify-center">
                          {item.tag === "venue"  && <Building2  className="w-3.5 h-3.5 text-blue-400" />}
                          {item.tag === "vendor" && <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />}
                          {!item.tag && warnRow  && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                          {!item.tag && !warnRow && (
                            <span className="text-[10px] font-bold text-slate-300">{idx + 1}</span>
                          )}
                        </div>
                        <Input
                          placeholder={`Service ${idx + 1}`}
                          value={item.serviceName}
                          onChange={(e) => updateItem(item.id, "serviceName", e.target.value)}
                          className="h-8 flex-1 rounded-lg text-sm border-0 bg-transparent px-1 focus-visible:ring-1"
                          data-testid={`input-service-name-${idx}`}
                        />
                        <div className="relative w-28 shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                          <Input
                            type="number" placeholder="0" value={item.cost}
                            onChange={(e) => updateItem(item.id, "cost", e.target.value)}
                            className={`h-8 rounded-lg text-sm pl-5 ${warnRow ? "border-amber-300" : ""}`}
                            data-testid={`input-service-cost-${idx}`}
                          />
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-200 hover:text-red-500 transition shrink-0"
                          data-testid={`button-remove-item-${idx}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Vendor Quick-Add */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/70 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Add from Vendor Catalog
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={quickVendorId} onValueChange={(v) => { setQuickVendorId(v); setQuickProductId(""); }}>
                      <SelectTrigger className="h-8 rounded-lg text-xs bg-white" data-testid="select-quick-vendor">
                        <SelectValue placeholder="Select vendor…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(vendors as any[]).map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name}
                            <span className="text-slate-400 ml-1 text-[10px]"> · {v.category}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={quickProductId}
                      onValueChange={setQuickProductId}
                      disabled={!quickVendorId || quickProducts.length === 0}
                    >
                      <SelectTrigger className="h-8 rounded-lg text-xs bg-white" data-testid="select-quick-product">
                        <SelectValue placeholder={
                          !quickVendorId ? "Pick vendor first" :
                          quickProducts.length === 0 ? "No services listed" : "Select service…"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {quickProducts.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                            <span className="text-indigo-600 font-semibold ml-2">{fmtFull(Number(p.price))}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox" checked={quickPerGuest}
                        onChange={(e) => setQuickPerGuest(e.target.checked)}
                        className="rounded accent-indigo-600" data-testid="checkbox-per-guest"
                      />
                      <span className="text-xs text-slate-600">
                        Per guest{guestCount ? ` (×${guestCount})` : ""}
                      </span>
                    </label>
                    <Button size="sm" onClick={addVendorService} disabled={!quickProductId}
                      className="h-7 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-700 ml-auto"
                      data-testid="button-add-vendor-service">
                      <Plus className="w-3 h-3 mr-1" /> Add to Quote
                    </Button>
                  </div>
                </div>

                {/* Pricing adjustments */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Pricing Adjustments</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">Discount (%)</label>
                      <Input type="number" min={0} max={100} value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="h-9 rounded-xl text-sm" data-testid="input-discount" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">Tax (%)</label>
                      <Input type="number" min={0} value={tax}
                        onChange={(e) => setTax(e.target.value)}
                        className="h-9 rounded-xl text-sm" data-testid="input-tax" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Markup (%)
                        <span className="text-emerald-500 font-normal ml-1 text-[10px]">= profit</span>
                      </label>
                      <Input type="number" min={0} value={markup}
                        onChange={(e) => setMarkup(e.target.value)}
                        className="h-9 rounded-xl text-sm" data-testid="input-markup" />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes / Terms</label>
                  <Textarea
                    placeholder="Any additional notes, terms & conditions…"
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    rows={2} className="rounded-xl text-sm resize-none" data-testid="input-notes"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── CARD 3: Print Preview ── */}
            <Card className="border border-slate-100 shadow-sm" id="quote-preview" ref={printRef}>
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <CardTitle className="text-base">Quote Preview</CardTitle>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">Print-ready</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">

                {/* Header with logo */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">EE</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-base leading-tight">EventElite</p>
                      <p className="text-[11px] text-slate-400">Professional Event Management</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Quotation</p>
                    <p className="text-2xl font-bold text-slate-800 mt-0.5">
                      #{selectedQuoteId ? String(selectedQuoteId).padStart(4, "0") : "DRAFT"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(), "MMMM d, yyyy")}</p>
                    <Badge className={`mt-1.5 text-[9px] px-2 border-0 ${STATUS_STYLES[status]?.chip}`}>{status}</Badge>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Client + Event block */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Prepared For</p>
                    {selectedClient ? (
                      <>
                        <p className="font-bold text-slate-800">{selectedClient.name}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {selectedClient.email}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {selectedClient.phone}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Select a client above</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Event Details</p>
                    <p className="font-semibold text-slate-800">{eventType}</p>
                    {guestCount && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" /> {guestCount} guests
                      </p>
                    )}
                    {eventDate && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(eventDate + "T00:00:00"), "MMMM d, yyyy")}
                      </p>
                    )}
                    {selectedVenue && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {selectedVenue.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b-2 border-slate-900/10 pb-2 mb-2">
                    <div className="col-span-8">Description</div>
                    <div className="col-span-4 text-right">Amount</div>
                  </div>
                  {items.filter((i) => i.serviceName.trim()).length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-6 text-center">Add services above to see them here</p>
                  ) : (
                    items.filter((i) => i.serviceName.trim()).map((item, idx) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-12 py-2.5 border-b border-slate-50 ${idx % 2 === 0 ? "" : "bg-slate-50/40"}`}
                      >
                        <div className="col-span-8 flex items-center gap-2">
                          {item.tag === "venue"  && <Building2  className="w-3 h-3 text-blue-400 shrink-0" />}
                          {item.tag === "vendor" && <ShoppingBag className="w-3 h-3 text-purple-400 shrink-0" />}
                          <div>
                            <p className="text-sm text-slate-700 font-medium">{item.serviceName}</p>
                            {item.tag === "venue" && selectedVenue && (
                              <p className="text-[10px] text-slate-400">{selectedVenue.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="col-span-4 text-right text-sm font-semibold text-slate-800 flex items-center justify-end">
                          {Number(item.cost) > 0 ? fmtFull(Number(item.cost)) : <span className="text-amber-400 text-xs italic">TBD</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cost breakdown */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">{fmtFull(calc.totalCost)}</span>
                  </div>
                  {Number(discount) > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Discount ({discount}%)</span>
                      <span className="font-semibold">−{fmtFull(calc.discountAmt)}</span>
                    </div>
                  )}
                  {Number(tax) > 0 && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Tax ({tax}%)</span>
                      <span className="font-semibold">+{fmtFull(calc.taxAmt)}</span>
                    </div>
                  )}
                  {Number(markup) > 0 && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Agency markup ({markup}%)</span>
                      <span className="font-semibold">+{fmtFull(calc.markupAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900 mt-2">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-indigo-600">{fmtFull(calc.finalPrice)}</span>
                  </div>
                  {calc.perGuest > 0 && (
                    <p className="text-[10px] text-slate-400 text-right">
                      {fmtFull(calc.perGuest)} per guest · {guestCount} guests
                    </p>
                  )}
                </div>

                {/* Notes */}
                {notes && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes & Terms</p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{notes}</p>
                  </div>
                )}

                <p className="text-[10px] text-slate-300 text-center pt-2">
                  Generated by EventElite · {format(new Date(), "MMMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              RIGHT — Summary, Actions, Saved quotes
          ═══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-4">

            {/* ── Financial Summary ── */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <CardTitle className="text-sm">Financial Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">

                {/* Big total */}
                <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 text-white text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-1">Quote Total</p>
                  <p className="text-3xl font-bold">{fmtFull(calc.finalPrice)}</p>
                  {calc.perGuest > 0 && (
                    <p className="text-[11px] opacity-70 mt-1">{fmtFull(calc.perGuest)} / guest</p>
                  )}
                </div>

                {/* Breakdown rows */}
                {[
                  { label: "Service Cost",   val: calc.totalCost,   cls: "text-slate-700" },
                  ...(Number(discount) > 0
                    ? [{ label: `Discount (${discount}%)`, val: -calc.discountAmt, cls: "text-emerald-600" }]
                    : []),
                  ...(Number(tax) > 0
                    ? [{ label: `Tax (${tax}%)`, val: calc.taxAmt, cls: "text-slate-700" }]
                    : []),
                  ...(Number(markup) > 0
                    ? [{ label: `Markup (${markup}%)`, val: calc.markupAmt, cls: "text-slate-700" }]
                    : []),
                ].map(({ label, val, cls }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-semibold ${cls}`}>
                      {val < 0 ? `−${fmtFull(Math.abs(val))}` : fmtFull(val)}
                    </span>
                  </div>
                ))}

                {/* Profit highlight */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Your Profit</span>
                    <span className={`text-sm font-bold ${calc.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {fmtFull(calc.profit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Profit margin</span>
                    <span className={`font-semibold ${calc.margin >= 20 ? "text-emerald-600" : calc.margin >= 10 ? "text-amber-500" : "text-red-500"}`}>
                      {calc.margin.toFixed(1)}%{" "}
                      {calc.margin >= 25 ? "🟢 Excellent" :
                       calc.margin >= 15 ? "🟡 Good" :
                       calc.margin > 0   ? "🔴 Low" : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Quote Checklist ── */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <CardTitle className="text-sm">Readiness Checklist</CardTitle>
                  <span className={`ml-auto text-xs font-bold ${completeness.score === 100 ? "text-emerald-600" : "text-slate-400"}`}>
                    {completeness.score}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                <Progress
                  value={completeness.score}
                  className={`h-1.5 mb-3 ${completeness.score === 100 ? "[&>div]:bg-emerald-500" : ""}`}
                />
                {completeness.checks.map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? "bg-emerald-500" : "bg-slate-100"}`}>
                      {done && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-xs ${done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ── Actions ── */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <CardTitle className="text-sm">Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <Button
                  onClick={handleSave} disabled={isPending}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 h-9 text-sm font-semibold"
                  data-testid="button-save-quote"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isPending ? "Saving…" : selectedQuoteId ? "Update Quote" : "Save Quote"}
                </Button>
                <Button onClick={() => window.print()} variant="outline"
                  className="w-full rounded-xl h-9 text-sm" data-testid="button-print-quote">
                  <Printer className="w-4 h-4 mr-2" /> Print / Export PDF
                </Button>
                <Button
                  variant="outline" className="w-full rounded-xl h-9 text-sm"
                  onClick={() => handleStatusChange("Sent")} disabled={!selectedQuoteId}
                  data-testid="button-send-quote"
                >
                  <Send className="w-4 h-4 mr-2" /> Mark as Sent
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-9 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setConvertDialogOpen(true)} disabled={!clientId}
                  data-testid="button-convert-event"
                >
                  <ArrowRight className="w-4 h-4 mr-2" /> Convert to Event
                </Button>
              </CardContent>
            </Card>

            {/* ── Status picker ── */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm">Update Status</CardTitle>
                {!selectedQuoteId && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Save the quote first to change status</p>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={!selectedQuoteId}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 ${
                        status === s
                          ? `${STATUS_STYLES[s]?.chip} border-current shadow-sm`
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      data-testid={`button-status-${s.toLowerCase()}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${status === s ? STATUS_STYLES[s]?.dot : "bg-slate-300"}`} />
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Saved quotes ── */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">Saved Quotes</CardTitle>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                      {(quotations as any[]).length}
                    </span>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search quotes…"
                    value={quoteSearch}
                    onChange={(e) => setQuoteSearch(e.target.value)}
                    className="h-7 pl-7 text-xs rounded-lg border-slate-200"
                    data-testid="input-search-quotes"
                  />
                </div>

                {/* Status filter */}
                <div className="flex gap-1 overflow-x-auto">
                  {["All", ...STATUSES].map((s) => {
                    const count = s === "All"
                      ? (quotations as any[]).length
                      : (quotations as any[]).filter((q) => q.status === s).length;
                    return (
                      <button
                        key={s}
                        onClick={() => setQuoteStatusFilter(s)}
                        data-testid={`filter-quotes-${s.toLowerCase()}`}
                        className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                          quoteStatusFilter === s
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {s} {count > 0 && <span className="opacity-70">({count})</span>}
                      </button>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
                ) : filteredQuotations.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">
                      {(quotations as any[]).length === 0 ? "No quotes yet" : "No matches found"}
                    </p>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      {(quotations as any[]).length === 0 ? "Fill the form and save your first quote" : "Try a different filter"}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                    {filteredQuotations.map((q: any) => {
                      const c = (clients as any[]).find((x) => x.id === q.clientId);
                      const isActive = selectedQuoteId === q.id;
                      return (
                        <li
                          key={q.id}
                          onClick={() => loadQuote(q)}
                          className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors group ${isActive ? "bg-indigo-50/60 border-l-[3px] border-indigo-500" : ""}`}
                          data-testid={`quote-item-${q.id}`}
                        >
                          {/* Status bar indicator */}
                          <div className={`w-1 h-8 rounded-full shrink-0 ${STATUS_STYLES[q.status]?.bar || "bg-slate-200"}`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-700 truncate">
                                {c ? c.name : q.eventType}
                              </p>
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[q.status]?.chip}`}>
                                {q.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">{q.eventType}</span>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className="text-[10px] text-slate-400">
                                {format(new Date(q.createdAt), "MMM d")}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className="text-xs font-bold text-indigo-600">{fmt(Number(q.finalPrice))}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(q.id); }}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                              data-testid={`button-delete-quote-${q.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Convert to Event dialog ── */}
        <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Convert Quote to Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <p className="text-sm text-slate-500">
                This will create planned services for <strong>{selectedClient?.name}</strong> and mark this quote as <strong>Accepted</strong>.
              </p>
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Services to create</p>
                {items.filter((i) => i.serviceName.trim()).map((i) => (
                  <div key={i.id} className="flex justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      {i.tag === "venue" && <Building2 className="w-3 h-3 text-blue-400" />}
                      {i.tag === "vendor" && <ShoppingBag className="w-3 h-3 text-purple-400" />}
                      {!i.tag && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                      {i.serviceName}
                    </span>
                    <span className="font-semibold">{fmtFull(Number(i.cost) || 0)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between text-xs font-bold text-indigo-700">
                  <span>Total Quote Value</span>
                  <span>{fmtFull(calc.finalPrice)}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={handleConvertToEvent}
                disabled={createService.isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-confirm-convert"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {createService.isPending ? "Converting…" : "Convert to Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete confirm dialog ── */}
        <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader><DialogTitle>Delete Quote</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500 mt-2">Are you sure you want to delete this quote? This cannot be undone.</p>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="rounded-xl">Cancel</Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                data-testid="button-confirm-delete-quote"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
}
