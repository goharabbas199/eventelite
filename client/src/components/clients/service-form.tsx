import { useCreatePlannedService, useUpdatePlannedService, useCreateVendorPayment } from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertPlannedServiceSchema,
  type InsertPlannedService,
  type PlannedService,
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceFormProps {
  clientId: number;
  editingService: PlannedService | null;
  onSuccess: () => void;
}

export function ServiceForm({ clientId, editingService, onSuccess }: ServiceFormProps) {
  const { mutate: create, isPending: isCreating } = useCreatePlannedService();
  const { mutate: update, isPending: isUpdating } = useUpdatePlannedService();
  const { mutate: createVendorPayment } = useCreateVendorPayment();
  const { data: vendors } = useVendors();

  const form = useForm<Omit<InsertPlannedService, "clientId">>({
    resolver: zodResolver(insertPlannedServiceSchema.omit({ clientId: true })),
    defaultValues: {
      serviceName: editingService?.serviceName ?? "",
      cost: editingService?.cost ? Number(editingService.cost) : 0,
      vendorId: editingService?.vendorId ?? undefined,
      notes: editingService?.notes ?? "",
    },
  });

  function onSubmit(data: Omit<InsertPlannedService, "clientId">) {
    if (editingService) {
      update(
        { serviceId: editingService.id, clientId, ...data, cost: Number(data.cost) },
        { onSuccess: () => { form.reset(); onSuccess(); } }
      );
    } else {
      create(
        { clientId, ...data },
        {
          onSuccess: (createdService) => {
            // If vendor + cost assigned, immediately create the vendor payment record
            if (createdService.vendorId && Number(createdService.cost) > 0) {
              createVendorPayment({
                clientId,
                vendorId: createdService.vendorId,
                serviceId: createdService.id,
                amount: String(createdService.cost),
                status: "Unpaid",
                notes: `Auto-generated from Planned Service: ${createdService.serviceName}`,
              });
            }
            form.reset();
            onSuccess();
          },
        }
      );
    }
  }

  const labelSuffix = (text: string) => (
    <span className="font-normal text-slate-400">{text}</span>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="serviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Catering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor {labelSuffix("(optional)")}</FormLabel>
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vendors?.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes {labelSuffix("(optional)")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isCreating || isUpdating} className="w-full mt-2">
          {isCreating || isUpdating
            ? editingService ? "Saving…" : "Adding…"
            : editingService ? "Save Changes" : "Add Service"}
        </Button>
      </form>
    </Form>
  );
}
