import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ReceiptText, CalendarDays, Users, DollarSign, CheckCircle,
  Clock, AlertCircle, Building2, Mail, Phone, Printer,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  unpaid:  { label: "Unpaid",  color: "bg-amber-100 text-amber-700" },
  paid:    { label: "Paid",    color: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-600" },
};

export default function ClientPortal() {
  const params = useParams<{ id: string }>();
  const invoiceId = Number(params.id);
  const [data, setData] = useState<{ invoice: any; client: any; quotation: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) { setError("Invalid invoice link"); setLoading(false); return; }
    fetch(`/api/portal/invoice/${invoiceId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Invoice not found");
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Invoice Not Found</p>
            <p className="text-sm text-slate-400 mt-1">{error || "This link may be invalid or expired."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice, client, quotation } = data;
  const sc = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.unpaid;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <ReceiptText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">EventElite</h1>
          <p className="text-slate-400 text-sm mt-1">Client Invoice Portal</p>
        </div>

        {/* Invoice Card */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                <p className="text-sm text-slate-400 mt-0.5">
                  Issued {format(new Date(invoice.createdAt), "MMMM d, yyyy")}
                </p>
              </div>
              <Badge className={`text-sm px-3 py-1 ${sc.color}`}>{sc.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Client Info */}
            {client && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Billed To</p>
                <p className="font-semibold text-slate-800">{client.name}</p>
                <div className="flex flex-col gap-1 mt-1">
                  {client.email && (
                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />{client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />{client.phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Event Details */}
            {client && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Event Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 font-medium">Event Type</p>
                    <p className="font-semibold text-slate-700 text-sm mt-0.5">{client.eventType || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] text-slate-400 font-medium">Event Date</p>
                    <p className="font-semibold text-slate-700 text-sm mt-0.5">
                      {client.eventDate ? format(new Date(client.eventDate), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                  {client.guestCount && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-400 font-medium">Guests</p>
                      <p className="font-semibold text-slate-700 text-sm mt-0.5">{client.guestCount}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quotation Items */}
            {quotation && quotation.items && quotation.items.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Services Included</p>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  {quotation.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-4 py-2.5 ${idx < quotation.items.length - 1 ? "border-b border-slate-100" : ""}`}
                    >
                      <span className="text-sm text-slate-600">{item.serviceName}</span>
                      <span className="text-sm font-semibold text-slate-700">
                        ${Number(item.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Due */}
            <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Amount Due</p>
                {invoice.dueDate && (
                  <p className="text-xs text-indigo-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <p className="text-3xl font-bold text-indigo-700">
                ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-500 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print button */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2"
            data-testid="button-print-portal"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
        </div>

        <p className="text-center text-xs text-slate-300 pb-6">
          Powered by EventElite Agency Management
        </p>
      </div>
    </div>
  );
}
