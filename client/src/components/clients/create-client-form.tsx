import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateClient, useCreatePlannedService } from "@/hooks/use-clients";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CreateClientFormProps {
  onSuccess: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  budget: string;
  guestCount: string;
  status: string;
  notes: string;
}

const EVENT_TEMPLATES: Record<string, string[]> = {
  Wedding:    ["Venue", "Catering", "Decoration", "Photography", "DJ"],
  Corporate:  ["Venue", "Catering", "AV Equipment", "Photography"],
  Birthday:   ["Venue", "Catering", "Decoration", "Photography"],
  Engagement: ["Venue", "Catering", "Decoration", "Photography"],
  Conference: ["Venue", "Catering", "AV Equipment"],
};

const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Engagement", "Conference", "Other"] as const;
const STATUSES = ["Lead", "Pending", "Confirmed", "Completed"] as const;

const labelCls = "text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block";
const inputCls = "h-9 rounded-xl text-sm";
const nativeSelectCls =
  "w-full h-9 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm " +
  "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors";

export function CreateClientForm({ onSuccess }: CreateClientFormProps) {
  const { mutate, isPending } = useCreateClient();
  const { mutateAsync: createService } = useCreatePlannedService();
  const [, setLocation] = useLocation();
  const [customEventType, setCustomEventType] = useState("");
  const [applyTemplate, setApplyTemplate] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "", email: "", phone: "", eventDate: "",
    eventType: "Wedding", budget: "", guestCount: "", status: "Lead", notes: "",
  });

  const handleChange = (key: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.eventDate) {
      return alert("Please fill all required fields");
    }
    const finalEventType =
      formData.eventType === "Other" && customEventType ? customEventType : formData.eventType;

    mutate(
      { ...formData, eventType: finalEventType, eventDate: new Date(formData.eventDate) },
      {
        onSuccess: async (newClient: { id: number }) => {
          if (applyTemplate && EVENT_TEMPLATES[finalEventType]) {
            await Promise.all(
              EVENT_TEMPLATES[finalEventType].map((svc) =>
                createService({ clientId: newClient.id, serviceName: svc, cost: "0", status: "Planned" })
              )
            );
          }
          onSuccess();
          setLocation(`/clients/${newClient.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name *</label>
          <Input className={inputCls} placeholder="Client / Event name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Email *</label>
          <Input className={inputCls} type="email" placeholder="email@example.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Phone *</label>
          <Input className={inputCls} placeholder="+1 555 0000" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Event Date *</label>
          <Input className={inputCls} type="date" value={formData.eventDate} onChange={(e) => handleChange("eventDate", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Event Type</label>
          <select className={nativeSelectCls} value={formData.eventType} onChange={(e) => handleChange("eventType", e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {formData.eventType === "Other" && (
          <div>
            <label className={labelCls}>Custom Type</label>
            <Input className={inputCls} placeholder="Event type name" value={customEventType} onChange={(e) => setCustomEventType(e.target.value)} />
          </div>
        )}
        <div>
          <label className={labelCls}>Budget ($)</label>
          <Input className={inputCls} type="number" min={0} placeholder="25000" value={formData.budget} onChange={(e) => handleChange("budget", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Guest Count</label>
          <Input className={inputCls} type="number" min={0} placeholder="150" value={formData.guestCount} onChange={(e) => handleChange("guestCount", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={nativeSelectCls} value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Template toggle */}
      <label className="flex items-center gap-2.5 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={applyTemplate}
          onChange={(e) => setApplyTemplate(e.target.checked)}
          className="accent-indigo-600 w-4 h-4 shrink-0"
        />
        <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-snug">
          Auto-create default services from event template
        </span>
      </label>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700"
      >
        {isPending ? "Creating…" : "Create Client"}
      </Button>
    </div>
  );
}
