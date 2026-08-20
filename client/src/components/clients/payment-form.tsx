import { useState } from "react";
import { useCreatePayment } from "@/hooks/use-clients";
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

interface PaymentFormProps {
  clientId: number;
  onSuccess: () => void;
}

interface FormState {
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
}

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Credit Card", "Online"] as const;

const labelCls = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block";

export function PaymentForm({ clientId, onSuccess }: PaymentFormProps) {
  const { mutate, isPending } = useCreatePayment();
  const [form, setForm] = useState<FormState>({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash",
    notes: "",
  });

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      {
        clientId,
        amount: form.amount,
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      },
      { onSuccess }
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 py-2">
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
        <label className={labelCls}>Payment Date</label>
        <Input
          type="date"
          required
          value={form.paymentDate}
          onChange={(e) => set("paymentDate", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Payment Method</label>
        <Select value={form.paymentMethod} onValueChange={(val) => set("paymentMethod", val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={labelCls}>
          Notes <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <Textarea
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : "Record Payment"}
      </Button>
    </form>
  );
}
