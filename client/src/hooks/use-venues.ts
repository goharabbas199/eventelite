import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { InsertVenue, InsertBookingOption } from "@shared/schema";

export function useVenues() {
  return useQuery({
    queryKey: [api.venues.list.path],
    queryFn: async () => {
      const res = await fetch(api.venues.list.path);
      if (!res.ok) throw new Error("Failed to fetch venues");
      return api.venues.list.responses[200].parse(await res.json());
    },
  });
}

export function useVenue(id: number) {
  return useQuery({
    queryKey: [api.venues.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.venues.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch venue");
      return api.venues.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVenue) => {
      const payload = { ...data, basePrice: String(data.basePrice), capacity: Number(data.capacity) };
      const res = await fetch(api.venues.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create venue");
      return api.venues.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.venues.list.path] });
    },
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.venues.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete venue");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.venues.list.path] });
    },
  });
}

export function useCreateBookingOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ venueId, ...data }: { venueId: number } & Omit<InsertBookingOption, "venueId">) => {
      const url = buildUrl(api.bookingOptions.create.path, { venueId });
      const payload = { ...data, price: String(data.price) };
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create booking option");
      return api.bookingOptions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.venues.get.path, variables.venueId] });
    },
  });
}
