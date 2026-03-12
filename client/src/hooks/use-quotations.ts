import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const QK = "/api/quotations";

export function useQuotations() {
  return useQuery({
    queryKey: [QK],
    queryFn: async () => {
      const res = await fetch(QK);
      if (!res.ok) throw new Error("Failed to fetch quotations");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useQuotation(id: number) {
  return useQuery({
    queryKey: [QK, id],
    queryFn: async () => {
      const res = await fetch(`${QK}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch quotation");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(QK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create quotation");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [k: string]: any }) => {
      const res = await fetch(`${QK}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update quotation");
      return res.json();
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: [QK, v.id] });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${QK}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quotation");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
