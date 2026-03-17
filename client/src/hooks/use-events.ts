import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const QK = "/api/events";

export function useEvents() {
  return useQuery({
    queryKey: [QK],
    queryFn: async () => {
      const res = await fetch(QK);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json() as Promise<any[]>;
    },
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: [QK, id],
    queryFn: async () => {
      const res = await fetch(`${QK}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useClientEvents(clientId: number) {
  return useQuery({
    queryKey: ["/api/clients", clientId, "events"],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/events`);
      if (!res.ok) throw new Error("Failed to fetch client events");
      return res.json() as Promise<any[]>;
    },
    enabled: !!clientId,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(QK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [k: string]: any }) => {
      const res = await fetch(`${QK}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: [QK, v.id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${QK}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
}
