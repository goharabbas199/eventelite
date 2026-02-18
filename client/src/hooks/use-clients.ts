import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  InsertClient,
  InsertPlannedService,
  InsertExpense,
} from "@shared/schema";

export function useClients() {
  return useQuery({
    queryKey: [api.clients.list.path],
    queryFn: async () => {
      const res = await fetch(api.clients.list.path);
      if (!res.ok) throw new Error("Failed to fetch clients");
      return api.clients.list.responses[200].parse(await res.json());
    },
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [api.clients.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.clients.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch client");

      const raw = await res.json();

      return api.clients.get.responses[200].parse({
        ...raw,
        eventDate: new Date(raw.eventDate),
        createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
      });
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertClient) => {
      const payload: any = {
        ...data,
        eventDate: new Date(data.eventDate).toISOString(),
      };

      // ✅ Only send budget if it exists
      if (data.budget !== undefined && data.budget !== null) {
        payload.budget = String(data.budget);
      }

      const res = await fetch(api.clients.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create client");
      }

      return api.clients.create.responses[201].parse(await res.json());
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.list.path],
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: number } & Partial<InsertClient>) => {
      const url = buildUrl(api.clients.update.path, { id });

      const payload: any = { ...data };

      if (data.budget !== undefined && data.budget !== null) {
        payload.budget = String(data.budget);
      }

      if (data.eventDate) {
        payload.eventDate = new Date(data.eventDate).toISOString();
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update client");
      }

      return api.clients.update.responses[200].parse(await res.json());
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: [api.clients.list.path],
      });
    },
  });
}

export function useCreatePlannedService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      ...data
    }: { clientId: number } & Omit<InsertPlannedService, "clientId">) => {
      const url = buildUrl(api.plannedServices.create.path, { clientId });

      const payload = {
        ...data,
        cost: String(data.cost),
        vendorId: data.vendorId ? Number(data.vendorId) : undefined,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create service");

      return api.plannedServices.create.responses[201].parse(await res.json());
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      ...data
    }: { clientId: number } & Omit<InsertExpense, "clientId">) => {
      const url = buildUrl(api.expenses.create.path, { clientId });

      const payload = {
        ...data,
        cost: String(data.cost),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create expense");

      return api.expenses.create.responses[201].parse(await res.json());
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });

      queryClient.invalidateQueries({
        queryKey: [api.expenses.list.path, variables.clientId],
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      clientId,
      ...data
    }: { id: number; clientId: number } & Partial<InsertExpense>) => {
      const url = buildUrl(api.expenses.update.path, { id });

      const payload: any = { ...data };

      if (data.cost !== undefined && data.cost !== null) {
        payload.cost = String(data.cost);
      }

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update expense");

      return api.expenses.update.responses[200].parse(await res.json());
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });

      queryClient.invalidateQueries({
        queryKey: [api.expenses.list.path],
      });
    },
  });
}
