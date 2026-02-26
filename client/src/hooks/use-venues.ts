import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertVenue, InsertBookingOption } from "@shared/schema";

/* ================================
   GET ALL VENUES
================================ */

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: async () => {
      const res = await fetch(api.venues.list.path);
      if (!res.ok) throw new Error("Failed to fetch venues");
      return await res.json();
    },
  });
}

/* ================================
   GET SINGLE VENUE
================================ */

export function useVenue(id: number) {
  return useQuery({
    queryKey: ["venue", id],
    queryFn: async () => {
      const url = buildUrl(api.venues.get.path, { id });
      const res = await fetch(url);

      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch venue");

      return await res.json();
    },
    enabled: !!id,
  });
}

/* ================================
   CREATE VENUE
================================ */

export function useCreateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertVenue) => {
      const payload = {
        ...data,
        basePrice: String(data.basePrice),
        capacity: Number(data.capacity),
      };

      const res = await fetch(api.venues.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to create venue");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

/* ================================
   DELETE VENUE (ONLY ONE VERSION)
================================ */

export function useDeleteVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.venues.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });

      if (!res.ok) throw new Error("Failed to delete venue");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}

/* ================================
   CREATE BOOKING OPTION
================================ */

export function useCreateBookingOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      variables: { venueId: number } & Omit<InsertBookingOption, "venueId">,
    ) => {
      const { venueId, ...data } = variables;

      const url = buildUrl(api.bookingOptions.create.path, {
        venueId,
      });

      const payload = {
        ...data,
        price: String(data.price),
        currency: data.currency || "USD",
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to create booking option");
      }

      return await res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.refetchQueries({
        queryKey: ["venue", variables.venueId],
      });
    },
  });
}

/* ================================
   DELETE BOOKING OPTION
================================ */

export function useDeleteBookingOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.bookingOptions.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete booking option");
      }
    },
    onSuccess: (_data, id) => {
      // safer refresh
      queryClient.invalidateQueries({ queryKey: ["venue"] });
    },
  });
}

/* ================================
   UPDATE VENUE
================================ */

export function useUpdateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: number } & Partial<InsertVenue>) => {
      const url = buildUrl(api.venues.update.path, { id });

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.message || "Failed to update venue");
      }

      return await res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.refetchQueries({
        queryKey: ["venue", variables.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["venues"],
      });
    },
  });
}
