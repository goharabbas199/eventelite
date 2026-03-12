import { useState, useMemo, useRef } from "react";
import { Layout } from "@/components/Layout";
import { useClients, useCreateClient, useCreatePlannedService } from "@/hooks/use-clients";
import { useVenues } from "@/hooks/use-venues";
import { useQuotations, useCreateQuotation, useUpdateQuotation, useDeleteQuotation } from "@/hooks/use-quotations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Trash2, FileText, Printer, Send, CheckCircle,
  TrendingUp, DollarSign, ChevronRight, Clock, Save,
  ArrowRight, ReceiptText, Users,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const STATUS_STYLES: Record<string, string> = {
  Draft:    "bg-slate-100 text-slate-600",
  Sent:     "bg-blue-100 text-blue-700",
  Accepted: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-600",
};

const STATUSES = ["Draft", "Sent", "Accepted", "Rejected"];
const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Engagement", "Conference", "Gala", "Other"];

type LineItem = { id: string; serviceName: string; cost: string };

function uid() { return Math.random().toString(36).slice(2, 9); }

function fmt(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function Quotations() {
  const { data: clients = [] } = useClients();
  const { data: venues = [] } = useVenues();
  const { data: quotations = [], isLoading } = useQuotations();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const deleteQuotation = useDeleteQuotation();
  const createClient = useCreateClient();
  const createService = useCreatePlannedService();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const printRef = useRef<HTMLDivElement>(null);

  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const [clientId, setClientId] = useState("");
  const [eventType, setEventType] = useState("Wedding");
  const [guestCount, setGuestCount] = useState("");
  const [venueId, setVenueId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ id: uid(), serviceName: "", cost: "" }]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [markup, setMarkup] = useState("20");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Draft");

  const selectedClient = clients.find((c: any) => String(c.id) === clientId);
  const selectedVenue = venues.find((v: any) => String(v.id) === venueId);

  const calc = useMemo(() => {
    const servicesTotal = items.reduce((s, it) => s + (Number(it.cost) || 0), 0);
    const venueCost = selectedVenue ? Number(selectedVenue.basePrice) : 0;
    const totalCost = servicesTotal + venueCost;
    const discountAmt = totalCost * (Number(discount) / 100);
    const afterDiscount = totalCost - discountAmt;
    const taxAmt = afterDiscount * (Number(tax) / 100);
    const markupAmt = afterDiscount * (Number(markup) / 100);
    const finalPrice = afterDiscount + taxAmt + markupAmt;
    const expectedProfit = finalPrice - totalCost;
    const profitMargin = finalPrice > 0 ? (expectedProfit / finalPrice) * 100 : 0;
    return { servicesTotal, venueCost, totalCost, discountAmt, afterDiscount, taxAmt, markupAmt, finalPrice, expectedProfit, profitMargin };
  }, [items, selectedVenue, discount, tax, markup]);

  function addItem() {
    setItems((prev) => [...prev, { id: uid(), serviceName: "", cost: "" }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: "serviceName" | "cost", value: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  function resetForm() {
    setClientId("");
    setEventType("Wedding");
    setGuestCount("");
    setVenueId("");
    setItems([{ id: uid(), serviceName: "", cost: "" }]);
    setDiscount("0");
    setTax("0");
    setMarkup("20");
    setNotes("");
    setStatus("Draft");
    setSelectedQuoteId(null);
  }

  function loadQuote(q: any) {
    setSelectedQuoteId(q.id);
    setClientId(q.clientId ? String(q.clientId) : "");
    setEventType(q.eventType || "Wedding");
    setGuestCount(q.guestCount ? String(q.guestCount) : "");
    setVenueId(q.venueId ? String(q.venueId) : "");
    setItems(
      (q.items || []).length > 0
        ? q.items.map((i: any) => ({ id: uid(), serviceName: i.serviceName, cost: String(i.cost) }))
        : [{ id: uid(), serviceName: "", cost: "" }]
    );
    setDiscount(q.discount || "0");
    setTax(q.tax || "0");
    setMarkup(q.markupPercentage || "20");
    setNotes(q.notes || "");
    setStatus(q.status || "Draft");
  }

  async function handleSave() {
    const payload = {
      clientId: clientId ? Number(clientId) : null,
      eventType,
      guestCount: guestCount ? Number(guestCount) : null,
      venueId: venueId ? Number(venueId) : null,
      totalCost: calc.totalCost,
      markupPercentage: Number(markup),
      discount: Number(discount),
      tax: Number(tax),
      finalPrice: calc.finalPrice,
      status,
      notes: notes || null,
      items: items.filter((i) => i.serviceName.trim()).map((i) => ({
        serviceName: i.serviceName,
        cost: Number(i.cost) || 0,
      })),
    };

    try {
      if (selectedQuoteId) {
        await updateQuotation.mutateAsync({ id: selectedQuoteId, ...payload });
        toast({ title: "Quotation updated" });
      } else {
        const created = await createQuotation.mutateAsync(payload);
        setSelectedQuoteId(created.id);
        toast({ title: "Quotation saved" });
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleStatusChange(newStatus: string) {
    if (!selectedQuoteId) { toast({ title: "Save the quote first", variant: "destructive" }); return; }
    await updateQuotation.mutateAsync({ id: selectedQuoteId, status: newStatus });
    setStatus(newStatus);
    toast({ title: `Status changed to ${newStatus}` });
  }

  async function handleConvertToEvent() {
    if (!selectedClient) { toast({ title: "Select a client first", variant: "destructive" }); return; }
    try {
      const budget = Math.round(calc.finalPrice);
      await updateQuotation.mutateAsync({ id: selectedQuoteId!, status: "Accepted" });
      const services = items.filter((i) => i.serviceName.trim());
      await Promise.all(
        services.map((i) =>
          createService.mutateAsync({
            clientId: Number(clientId),
            serviceName: i.serviceName,
            cost: Number(i.cost) || 0,
            status: "Planned",
          })
        )
      );
      toast({ title: "Services added to client event", description: `${services.length} service(s) added to ${selectedClient.name}` });
      setConvertDialogOpen(false);
      navigate(`/clients/${clientId}`);
    } catch {
      toast({ title: "Conversion failed", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    await deleteQuotation.mutateAsync(id);
    if (selectedQuoteId === id) resetForm();
    setConfirmDeleteId(null);
    toast({ title: "Quotation deleted" });
  }

  const isPending = createQuotation.isPending || updateQuotation.isPending;

  return (
    <>
      {/* Print-only style: show only the preview, hide everything else */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #quote-preview, #quote-preview * { visibility: visible !important; }
          #quote-preview { position: fixed; top: 0; left: 0; width: 100vw; padding: 40px; background: white; }
        }
      `}</style>

      <Layout title="Quotation Builder">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Sales</p>
            <h2 className="text-xl font-bold text-slate-900">Quotation Builder</h2>
          </div>
          <Button
            onClick={resetForm}
            variant="outline"
            className="h-9 rounded-xl text-xs"
            data-testid="button-new-quote"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Quote
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* ── LEFT: Builder + Preview ── */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* SECTION 1: Quote Builder */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-indigo-500" />
                  <CardTitle className="text-base">Quote Builder</CardTitle>
                  {selectedQuoteId && (
                    <Badge className={`ml-auto text-[10px] ${STATUS_STYLES[status]}`}>{status}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Row 1: Client + Event Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Client</label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="h-9 rounded-xl text-sm" data-testid="select-client">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Event Type</label>
                    <Select value={eventType} onValueChange={setEventType}>
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
                      type="number"
                      placeholder="150"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="h-9 rounded-xl text-sm"
                      data-testid="input-guest-count"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Venue</label>
                    <Select value={venueId} onValueChange={setVenueId}>
                      <SelectTrigger className="h-9 rounded-xl text-sm" data-testid="select-venue">
                        <SelectValue placeholder="Select venue (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No venue</SelectItem>
                        {venues.map((v: any) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name} — {fmt(Number(v.basePrice))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Service Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600">Services / Line Items</label>
                    <button
                      onClick={addItem}
                      className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                      data-testid="button-add-line-item"
                    >
                      <Plus className="w-3 h-3" /> Add line
                    </button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <Input
                          placeholder={`Service ${idx + 1}`}
                          value={item.serviceName}
                          onChange={(e) => updateItem(item.id, "serviceName", e.target.value)}
                          className="h-9 rounded-xl text-sm flex-1"
                          data-testid={`input-service-name-${idx}`}
                        />
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.cost}
                            onChange={(e) => updateItem(item.id, "cost", e.target.value)}
                            className="h-9 rounded-xl text-sm pl-6"
                            data-testid={`input-service-cost-${idx}`}
                          />
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-red-400 hover:text-red-600 transition disabled:opacity-30"
                          data-testid={`button-remove-item-${idx}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modifiers */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Discount (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="h-9 rounded-xl text-sm"
                      data-testid="input-discount"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Tax (%)</label>
                    <Input
                      type="number"
                      min={0}
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="h-9 rounded-xl text-sm"
                      data-testid="input-tax"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1.5">Markup (%)</label>
                    <Input
                      type="number"
                      min={0}
                      value={markup}
                      onChange={(e) => setMarkup(e.target.value)}
                      className="h-9 rounded-xl text-sm"
                      data-testid="input-markup"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes / Terms</label>
                  <Textarea
                    placeholder="Any additional notes, terms & conditions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="rounded-xl text-sm resize-none"
                    data-testid="input-notes"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: Quote Preview (printable) */}
            <Card className="border border-slate-100 shadow-sm" id="quote-preview" ref={printRef}>
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <CardTitle className="text-base">Quote Preview</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">EE</span>
                      </div>
                      <span className="font-bold text-lg text-slate-900">EventElite</span>
                    </div>
                    <p className="text-xs text-slate-400">Professional Event Management</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quotation</p>
                    {selectedQuoteId && (
                      <p className="text-sm font-bold text-slate-700 mt-0.5">#{String(selectedQuoteId).padStart(4, "0")}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(), "MMMM d, yyyy")}</p>
                    <Badge className={`mt-1 text-[10px] ${STATUS_STYLES[status]}`}>{status}</Badge>
                  </div>
                </div>

                {/* Client + Event Info */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Prepared For</p>
                    {selectedClient ? (
                      <>
                        <p className="font-bold text-slate-800 text-sm">{selectedClient.name}</p>
                        <p className="text-xs text-slate-500">{selectedClient.email}</p>
                        <p className="text-xs text-slate-500">{selectedClient.phone}</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Select a client above</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Event Details</p>
                    <p className="text-xs text-slate-600 font-medium">{eventType}</p>
                    {guestCount && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3" /> {guestCount} guests</p>}
                    {selectedVenue && <p className="text-xs text-slate-500 mt-0.5">📍 {selectedVenue.name}</p>}
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <div className="grid grid-cols-12 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2">
                    <div className="col-span-8">Description</div>
                    <div className="col-span-4 text-right">Amount</div>
                  </div>
                  {selectedVenue && (
                    <div className="grid grid-cols-12 py-2 border-b border-slate-50">
                      <div className="col-span-8">
                        <p className="text-sm font-medium text-slate-700">Venue — {selectedVenue.name}</p>
                        <p className="text-xs text-slate-400">{selectedVenue.location}</p>
                      </div>
                      <div className="col-span-4 text-right text-sm font-semibold text-slate-800">{fmt(calc.venueCost)}</div>
                    </div>
                  )}
                  {items.filter((i) => i.serviceName.trim()).map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 py-2 border-b border-slate-50">
                      <div className="col-span-8 text-sm text-slate-700">{item.serviceName}</div>
                      <div className="col-span-4 text-right text-sm font-semibold text-slate-800">{fmt(Number(item.cost) || 0)}</div>
                    </div>
                  ))}
                  {items.filter((i) => i.serviceName.trim()).length === 0 && !selectedVenue && (
                    <p className="text-sm text-slate-400 italic py-4 text-center">Add services above to see them here</p>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium text-slate-700">{fmt(calc.totalCost)}</span>
                  </div>
                  {Number(discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Discount ({discount}%)</span>
                      <span className="text-emerald-600 font-medium">−{fmt(calc.discountAmt)}</span>
                    </div>
                  )}
                  {Number(tax) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tax ({tax}%)</span>
                      <span className="text-slate-700 font-medium">+{fmt(calc.taxAmt)}</span>
                    </div>
                  )}
                  {Number(markup) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Service Fee ({markup}%)</span>
                      <span className="text-slate-700 font-medium">+{fmt(calc.markupAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 mt-3">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-indigo-600" data-testid="text-final-price">{fmt(calc.finalPrice)}</span>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Notes</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Profit + Actions + Saved Quotes ── */}
          <div className="flex flex-col gap-4">

            {/* SECTION 3: Profit Calculation */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <CardTitle className="text-sm">Profit Calculation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[
                  { label: "Total Cost",       value: fmt(calc.totalCost),       cls: "text-slate-800" },
                  { label: `Markup (${markup}%)`,  value: fmt(calc.markupAmt),   cls: "text-indigo-600" },
                  { label: "Suggested Price",  value: fmt(calc.finalPrice),      cls: "text-indigo-700 font-bold" },
                  { label: "Expected Profit",  value: fmt(calc.expectedProfit),  cls: calc.expectedProfit >= 0 ? "text-emerald-600" : "text-red-500" },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className={`text-sm font-semibold ${cls}`} data-testid={`text-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}>{value}</span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-slate-500">Profit Margin</span>
                    <span className={`text-sm font-bold ${calc.profitMargin >= 0 ? "text-emerald-600" : "text-red-500"}`} data-testid="text-profit-margin">
                      {calc.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(Math.max(calc.profitMargin, 0), 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 4: Action Buttons */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <Button
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 h-9 text-sm"
                  data-testid="button-save-quote"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isPending ? "Saving..." : selectedQuoteId ? "Update Quote" : "Save Quote"}
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="w-full rounded-xl h-9 text-sm"
                  data-testid="button-print-quote"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print / Export PDF
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-9 text-sm"
                  onClick={() => handleStatusChange("Sent")}
                  disabled={!selectedQuoteId}
                  data-testid="button-send-quote"
                >
                  <Send className="w-4 h-4 mr-2" /> Mark as Sent
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-9 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setConvertDialogOpen(true)}
                  disabled={!selectedQuoteId || !clientId}
                  data-testid="button-convert-event"
                >
                  <ArrowRight className="w-4 h-4 mr-2" /> Convert to Event
                </Button>
              </CardContent>
            </Card>

            {/* SECTION 5: Quote Status */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm">Quote Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={!selectedQuoteId}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all disabled:opacity-40 ${
                        status === s
                          ? `${STATUS_STYLES[s]} border-current`
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                      data-testid={`button-status-${s.toLowerCase()}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Saved Quotes List */}
            <Card className="border border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Saved Quotes</CardTitle>
                  <span className="text-[10px] font-semibold text-slate-400">{quotations.length} total</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
                ) : quotations.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No saved quotes yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {quotations.map((q: any) => {
                      const client = clients.find((c: any) => c.id === q.clientId);
                      return (
                        <li
                          key={q.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors group ${selectedQuoteId === q.id ? "bg-indigo-50/60" : ""}`}
                          onClick={() => loadQuote(q)}
                          data-testid={`quote-item-${q.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700 truncate">
                                #{String(q.id).padStart(4, "0")} {client ? `— ${client.name}` : q.eventType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[q.status]}`}>{q.status}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {format(new Date(q.createdAt), "MMM d")}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            <span className="text-xs font-bold text-indigo-600">{fmt(Number(q.finalPrice))}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(q.id); }}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all ml-1"
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

        {/* Convert to Event dialog */}
        <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Convert to Event</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-500 mt-2">
              This will add <strong>{items.filter((i) => i.serviceName.trim()).length} service(s)</strong> to{" "}
              <strong>{selectedClient?.name}</strong>'s event and mark this quote as <strong>Accepted</strong>.
            </p>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setConvertDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button
                onClick={handleConvertToEvent}
                disabled={createService.isPending}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-confirm-convert"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {createService.isPending ? "Converting..." : "Convert"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm dialog */}
        <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Delete Quotation</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-500 mt-2">Are you sure? This cannot be undone.</p>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} className="rounded-xl">Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                className="rounded-xl"
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
