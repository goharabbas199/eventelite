import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import { useQuotations } from "@/hooks/use-quotations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Search, Trash2, Eye, CheckCircle, Clock, AlertCircle,
  ReceiptText, DollarSign, FileText, Copy, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid:  { label: "Unpaid",  color: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300" },
  paid:    { label: "Paid",    color: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300" },
  overdue: { label: "Overdue", color: "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400" },
};

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}-${rand}`;
}

function emptyForm() {
  return {
    clientId: "",
    quotationId: "",
    invoiceNumber: generateInvoiceNumber(),
    amount: "",
    status: "unpaid",
    dueDate: "",
    notes: "",
  };
}

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: clients = [] } = useClients();
  const { data: quotations = [] } = useQuotations();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [portalDialogId, setPortalDialogId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return (invoices as any[]).filter((inv) => {
      const client = (clients as any[]).find((c) => c.id === inv.clientId);
      const text = `${inv.invoiceNumber} ${client?.name || ""}`.toLowerCase();
      const matchSearch = !search || text.includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, clients, search, statusFilter]);

  const stats = useMemo(() => {
    const all = invoices as any[];
    const totalAmount = all.reduce((s, i) => s + Number(i.amount), 0);
    const paid = all.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
    const unpaid = all.filter((i) => i.status === "unpaid").reduce((s, i) => s + Number(i.amount), 0);
    const overdue = all.filter((i) => i.status === "overdue").length;
    return { total: all.length, totalAmount, paid, unpaid, overdue };
  }, [invoices]);

  function openCreate(fromQuotation?: any) {
    setEditingInvoice(null);
    const base = emptyForm();
    if (fromQuotation) {
      base.quotationId = String(fromQuotation.id);
      base.clientId = fromQuotation.clientId ? String(fromQuotation.clientId) : "";
      base.amount = fromQuotation.finalPrice ? String(Number(fromQuotation.finalPrice).toFixed(2)) : "";
    }
    setForm(base);
    setDialogOpen(true);
  }

  function openEdit(invoice: any) {
    setEditingInvoice(invoice);
    setForm({
      clientId: String(invoice.clientId),
      quotationId: invoice.quotationId ? String(invoice.quotationId) : "",
      invoiceNumber: invoice.invoiceNumber,
      amount: String(invoice.amount),
      status: invoice.status,
      dueDate: invoice.dueDate ? format(new Date(invoice.dueDate), "yyyy-MM-dd") : "",
      notes: invoice.notes || "",
    });
    setDialogOpen(true);
  }

  function handleQuotationChange(quotationId: string) {
    setForm((f) => ({ ...f, quotationId }));
    if (!quotationId || quotationId === "none") return;
    const q = (quotations as any[]).find((q) => String(q.id) === quotationId);
    if (!q) return;
    setForm((f) => ({
      ...f,
      quotationId,
      clientId: q.clientId ? String(q.clientId) : f.clientId,
      amount: q.finalPrice ? String(Number(q.finalPrice).toFixed(2)) : f.amount,
    }));
  }

  async function handleSave() {
    if (!form.clientId || !form.amount || !form.invoiceNumber) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    const payload: any = {
      clientId: Number(form.clientId),
      quotationId: form.quotationId && form.quotationId !== "none" ? Number(form.quotationId) : null,
      invoiceNumber: form.invoiceNumber,
      amount: form.amount,
      status: form.status,
      dueDate: form.dueDate || null,
      notes: form.notes || null,
    };
    try {
      if (editingInvoice) {
        await updateInvoice.mutateAsync({ id: editingInvoice.id, ...payload });
        toast({ title: "Invoice updated" });
      } else {
        await createInvoice.mutateAsync(payload);
        toast({ title: "Invoice created" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Failed to save invoice", variant: "destructive" });
    }
  }

  async function handleMarkPaid(invoice: any) {
    await updateInvoice.mutateAsync({ id: invoice.id, status: "paid" });
    toast({ title: "Invoice marked as paid" });
  }

  async function handleDelete(id: number) {
    await deleteInvoice.mutateAsync(id);
    setConfirmDeleteId(null);
    toast({ title: "Invoice deleted" });
  }

  const getClient = (id: number) => (clients as any[]).find((c) => c.id === id);
  const portalUrl = (id: number) => `${window.location.origin}/portal/${id}`;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
            <p className="text-sm text-slate-500 mt-0.5">Generate and track client invoices</p>
          </div>
          <Button onClick={() => openCreate()} data-testid="button-create-invoice" className="gap-2">
            <Plus className="w-4 h-4" /> New Invoice
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Invoices", value: `${stats.total}`, sub: "all time" },
            { label: "Total Value", value: `$${stats.totalAmount.toLocaleString()}`, sub: "all invoices", color: "text-slate-700 dark:text-white" },
            { label: "Collected", value: `$${stats.paid.toLocaleString()}`, sub: "paid invoices", color: "text-emerald-600" },
            { label: "Outstanding", value: `$${stats.unpaid.toLocaleString()}`, sub: "unpaid invoices", color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label} className="border border-slate-100 dark:border-slate-700 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color || "text-slate-700 dark:text-slate-200"}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Generate from Quote CTA */}
        {(quotations as any[]).filter((q) => q.status === "Accepted").length > 0 && (
          <Card className="border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/20 dark:to-slate-900 shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <FileText className="w-8 h-8 text-indigo-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Generate from Accepted Quote</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  You have {(quotations as any[]).filter((q) => q.status === "Accepted").length} accepted quote(s) ready to invoice
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(quotations as any[])
                  .filter((q) => q.status === "Accepted")
                  .slice(0, 3)
                  .map((q) => {
                    const client = getClient(q.clientId);
                    return (
                      <Button
                        key={q.id}
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        onClick={() => openCreate(q)}
                        data-testid={`button-invoice-from-quote-${q.id}`}
                      >
                        <Plus className="w-3 h-3" />
                        {client?.name || `Quote #${q.id}`}
                      </Button>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search invoices…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-invoices"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-invoice-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {Object.keys(STATUS_CONFIG).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Table */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400">Loading invoices…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ReceiptText className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No invoices found</p>
            <p className="text-slate-300 dark:text-slate-600 text-sm mt-1">Create your first invoice or generate one from a quote</p>
          </div>
        ) : (
          <Card className="border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((invoice) => {
                  const client = getClient(invoice.clientId);
                  const sc = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.unpaid;
                  return (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="pl-6 font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{client?.name || "—"}</TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status === "unpaid" && (
                            <button
                              onClick={() => handleMarkPaid(invoice)}
                              className="text-emerald-500 hover:text-emerald-700 transition"
                              title="Mark as Paid"
                              data-testid={`button-mark-paid-${invoice.id}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setPortalDialogId(invoice.id)}
                            className="text-indigo-500 hover:text-indigo-700 transition"
                            title="Client Portal Link"
                            data-testid={`button-portal-link-${invoice.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(invoice)}
                            className="text-slate-400 hover:text-slate-600 transition"
                            data-testid={`button-edit-invoice-${invoice.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(invoice.id)}
                            className="text-red-400 hover:text-red-600 transition"
                            data-testid={`button-delete-invoice-${invoice.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Generate from Quote (optional)</label>
              <Select value={form.quotationId || "none"} onValueChange={handleQuotationChange}>
                <SelectTrigger className="mt-1" data-testid="select-invoice-quotation">
                  <SelectValue placeholder="Select a quote…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked quote</SelectItem>
                  {(quotations as any[]).map((q) => {
                    const client = getClient(q.clientId);
                    return (
                      <SelectItem key={q.id} value={String(q.id)}>
                        {client?.name || "Unknown"} — {q.eventType} (${Number(q.finalPrice || 0).toLocaleString()})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client *</label>
              <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
                <SelectTrigger className="mt-1" data-testid="select-invoice-client">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {(clients as any[]).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice # *</label>
                <Input
                  className="mt-1"
                  value={form.invoiceNumber}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
                  data-testid="input-invoice-number"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount ($) *</label>
                <Input
                  type="number"
                  className="mt-1"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  data-testid="input-invoice-amount"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_CONFIG).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Due Date</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  data-testid="input-invoice-due-date"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
              <Textarea
                className="mt-1 resize-none"
                rows={2}
                placeholder="Payment terms, bank details…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                data-testid="textarea-invoice-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createInvoice.isPending || updateInvoice.isPending}
              data-testid="button-save-invoice"
            >
              {editingInvoice ? "Save Changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Invoice?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portal Link Dialog */}
      <Dialog open={!!portalDialogId} onOpenChange={() => setPortalDialogId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Client Portal Link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mb-3">Share this link with your client to let them view the invoice and quote details.</p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={portalDialogId ? portalUrl(portalDialogId) : ""}
              className="font-mono text-xs"
              data-testid="input-portal-url"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (portalDialogId) {
                  navigator.clipboard.writeText(portalUrl(portalDialogId));
                  toast({ title: "Link copied!" });
                }
              }}
              data-testid="button-copy-portal-link"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
