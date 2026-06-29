import { useState } from "react";
import { useCreateVendorPayment } from "@/hooks/use-clients";
import type { PlannedService } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Vendor {
  id: number;
  name: string;
}

export interface VendorPaymentFormProps {
  clientId: number;
  services: PlannedService[];
  vendors: Vendor[];
  onSuccess: () => void;
}

interface FormState {
  vendorId: string;
  serviceId: string;
  amount: string;
  status: string;
  paymentDate: string;
  notes: string;
}

const labelCls = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block";
const optional = <span className="font-normal text-slate-400">(optional)</span>;

export function VendorPaymentForm({ clientId, services, vendors, onSuccess }: VendorPaymentFormProps) {
  const { mutate, isPending } = useCreateVendorPayment();
  const [form, setForm] = useState<FormState>({
    vendorId: "",
    serviceId: "",
    amount: "",
    status: "Unpaid",
    paymentDate: "",
    notes: "",
  });

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      {
        clientId,
        vendorId: Number(form.vendorId),
        serviceId: form.serviceId ? Number(form.serviceId) : undefined,
        amount: form.amount,
        status: form.status,
        paymentDate: form.paymentDate || undefined,
        notes: form.notes || undefined,
      },
      { onSuccess }
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
      <div>
        <label className={labelCls}>Vendor</label>
        <Select value={form.vendorId} onValueChange={(val) => set("vendorId", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelCls}>Related Service {optional}</label>
        <Select value={form.serviceId} onValueChange={(val) => set("serviceId", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.serviceName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelCls}>Amount ($)</label>
        <Input
          type="number"
          required
          min={0}
          placeholder="0"
          value={form.amount}
          onChange={(e) => set("amount", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Status</label>
        <Select value={form.status} onValueChange={(val) => set("status", val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelCls}>Payment Date {optional}</label>
        <Input
          type="date"
          value={form.paymentDate}
          onChange={(e) => set("paymentDate", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Notes {optional}</label>
        <Textarea
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isPending || !form.vendorId} className="w-full">
        {isPending ? "Saving…" : "Add Vendor Payment"}
      </Button>
    </form>
  );
}
