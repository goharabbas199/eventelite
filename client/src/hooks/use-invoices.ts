import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const QK = "/api/invoices";

export function useInvoices() {
  return useQuery({
    queryKey: [QK],
    queryFn: async () => {
      const res = await fetch(QK);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: [QK, id],
    queryFn: async () => {
      const res = await fetch(`${QK}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useClientInvoices(clientId: number) {
  return useQuery({
    queryKey: ["/api/clients", clientId, "invoices"],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/invoices`);
      if (!res.ok) throw new Error("Failed to fetch client invoices");
      return res.json() as Promise<any[]>;
    },
    enabled: !!clientId,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(QK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [k: string]: any }) => {
      const res = await fetch(`${QK}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${QK}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
