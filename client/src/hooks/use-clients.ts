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
        eventDate: new Date(data.eventDate),
      };

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
      if (data.venueId !== undefined) {
        payload.venueId = data.venueId;
      }

      if (data.budget !== undefined && data.budget !== null) {
        payload.budget = String(data.budget);
      }

      if (data.eventDate) {
        payload.eventDate = new Date(data.eventDate);
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
      // 🔥 FORCE SAFE NUMBER
      const safeClientId = Number(clientId);

      if (isNaN(safeClientId)) {
        throw new Error("Client ID is invalid");
      }

      const url = buildUrl(api.plannedServices.create.path, {
        clientId: safeClientId,
      });

      const payload = {
        ...data,
        cost: String(data.cost),
        vendorId:
          data.vendorId !== undefined && data.vendorId !== null
            ? Number(data.vendorId)
            : undefined,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create service");
      }

      return api.plannedServices.create.responses[201].parse(await res.json());
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, Number(variables.clientId)],
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
      console.log("Expense URL:", url);
      console.log("ClientId being sent:", clientId);

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

export function useDeletePlannedService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      clientId,
    }: {
      serviceId: number;
      clientId: number;
    }) => {
      const url = buildUrl(api.plannedServices.delete.path, { id: serviceId });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete service");
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}

export function useUpdatePlannedService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      clientId,
      ...data
    }: {
      serviceId: number;
      clientId: number;
      cost?: number;
      notes?: string;
      status?: string;
    }) => {
      const payload: any = { ...data };
      if (payload.cost !== undefined) payload.cost = String(payload.cost);

      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update service");
      return res.json();
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
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


export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      ...data
    }: {
      clientId: number;
      amount: number | string;
      paymentDate: string;
      paymentMethod: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/clients/${clientId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: String(data.amount) }),
      });
      if (!res.ok) throw new Error("Failed to create payment");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number; clientId: number }) => {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete payment");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}

export function useCreateVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      ...data
    }: {
      clientId: number;
      vendorId: number;
      serviceId?: number;
      amount: number | string;
      status?: string;
      paymentDate?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/clients/${clientId}/vendor-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, clientId, amount: String(data.amount) }),
      });
      if (!res.ok) throw new Error("Failed to create vendor payment");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}

export function useUpdateVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      clientId,
      ...data
    }: {
      id: number;
      clientId: number;
      status?: string;
      paymentDate?: string;
    }) => {
      const res = await fetch(`/api/vendor-payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update vendor payment");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}

export function useDeleteVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number; clientId: number }) => {
      const res = await fetch(`/api/vendor-payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete vendor payment");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      title,
      dueDate,
      status,
    }: {
      clientId: number;
      title: string;
      dueDate?: string;
      status?: string;
    }) => {
      const res = await fetch(`/api/clients/${clientId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate: dueDate || null, status: status || "Pending" }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${variables.clientId}/tasks`] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      clientId,
      ...data
    }: {
      id: number;
      clientId: number;
      status?: string;
      title?: string;
      dueDate?: string | null;
    }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${variables.clientId}/tasks`] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number; clientId: number }) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${variables.clientId}/tasks`] });
    },
  });
}

export function useTasks(clientId: number) {
  return useQuery({
    queryKey: [`/api/clients/${clientId}/tasks`],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientId}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json() as Promise<Array<{ id: number; clientId: number; title: string; status: string; dueDate: string | null; createdAt: string }>>;
    },
    enabled: !!clientId,
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number; clientId: number }) => {
      const url = buildUrl(api.expenses.delete.path, { id });

      const res = await fetch(url, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete expense");
    },

    onSuccess: (_, variables) => {
      // refresh client details
      queryClient.invalidateQueries({
        queryKey: [api.clients.get.path, variables.clientId],
      });
    },
  });
}
