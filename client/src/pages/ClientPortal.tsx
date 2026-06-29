import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ReceiptText, Mail, Phone, Clock, AlertCircle, Printer,
} from "lucide-react";
import { format } from "date-fns";

/* ─── Types ─── */
interface PortalInvoice {
  invoiceNumber: string;
  createdAt: string;
  status: string;
  dueDate?: string;
  amount: string | number;
  notes?: string;
}

interface PortalClient {
  name: string;
  email?: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  guestCount?: number;
}

interface PortalQuotation {
  items?: Array<{ serviceName: string; cost: string | number }>;
}

interface PortalData {
  invoice: PortalInvoice;
  client: PortalClient;
  quotation: PortalQuotation;
}

const STATUS_CONFIG: Record<string, { label: string; badgeCls: string }> = {
  unpaid:  { label: "Unpaid",  badgeCls: "bg-amber-100 text-amber-700 border-amber-200" },
  paid:    { label: "Paid",    badgeCls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  overdue: { label: "Overdue", badgeCls: "bg-red-100 text-red-600 border-red-200" },
};

const sectionLabel = "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3 block";

/* ─── Component ─── */
export default function ClientPortal() {
  const params = useParams<{ id: string }>();
  const invoiceId = Number(params.id);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) { setError("Invalid invoice link"); setLoading(false); return; }
    fetch(`/api/portal/invoice/${invoiceId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invoice not found");
        return r.json();
      })
      .then((d: PortalData) => { setData(d); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 tracking-wide">Loading invoice…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center max-w-sm w-full">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="font-semibold text-slate-800 mb-1">Invoice Not Found</p>
          <p className="text-sm text-slate-400">{error ?? "This link may be invalid or expired."}</p>
        </div>
      </div>
    );
  }

  const { invoice, client, quotation } = data;
  const sc = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.unpaid;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .invoice-container { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F7F8FA] py-12 px-4 print:py-0 print:bg-white">
        <div className="max-w-[640px] mx-auto space-y-6">

          {/* Brand header */}
          <div className="text-center mb-10 no-print">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-900/20">
              <ReceiptText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">EventElite</h1>
            <p className="text-slate-400 text-xs tracking-widest uppercase mt-1 font-medium">
              Client Invoice Portal
            </p>
          </div>

          {/* Invoice card */}
          <div className="invoice-container bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Invoice header strip */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className={sectionLabel}>Invoice</p>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-xs text-slate-400 mt-1 tracking-wide">
                  Issued {format(new Date(invoice.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
              <Badge
                className={`text-xs font-semibold px-3 py-1.5 border ${sc.badgeCls} rounded-full`}
              >
                {sc.label}
              </Badge>
            </div>

            <div className="px-8 py-6 space-y-7">

              {/* Billed To */}
              {client && (
                <div>
                  <span className={sectionLabel}>Billed To</span>
                  <p className="font-semibold text-slate-800 text-base tracking-tight">
                    {client.name}
                  </p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    {client.email && (
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="text-sm text-slate-500 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Event Details */}
              {client && (client.eventType || client.eventDate || client.guestCount) && (
                <div>
                  <span className={sectionLabel}>Event Details</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {client.eventType && (
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                          Event Type
                        </p>
                        <p className="font-semibold text-slate-700 text-sm">{client.eventType}</p>
                      </div>
                    )}
                    {client.eventDate && (
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                          Event Date
                        </p>
                        <p className="font-semibold text-slate-700 text-sm">
                          {format(new Date(client.eventDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    )}
                    {client.guestCount && (
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                          Guests
                        </p>
                        <p className="font-semibold text-slate-700 text-sm">{client.guestCount}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Services */}
              {quotation?.items && quotation.items.length > 0 && (
                <div>
                  <span className={sectionLabel}>Services Included</span>
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    {quotation.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-4 py-3 ${
                          idx < quotation.items!.length - 1
                            ? "border-b border-slate-100"
                            : ""
                        } ${idx % 2 === 0 ? "" : "bg-slate-50/60"}`}
                      >
                        <span className="text-sm text-slate-600">{item.serviceName}</span>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">
                          ${Number(item.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount Due */}
              <div className="bg-indigo-600 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.12em] mb-1">
                    Amount Due
                  </p>
                  {invoice.dueDate && (
                    <p className="text-xs text-indigo-300 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3" />
                      Due {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
                  ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div>
                  <span className={sectionLabel}>Notes</span>
                  <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Print action */}
          <div className="text-center no-print">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2 rounded-xl px-5 h-10 text-sm font-medium"
              data-testid="button-print-portal"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </Button>
          </div>

          <p className="text-center text-xs text-slate-300 pb-8 tracking-wide no-print">
            Powered by EventElite Agency Management
          </p>
        </div>
      </div>
    </>
  );
}
