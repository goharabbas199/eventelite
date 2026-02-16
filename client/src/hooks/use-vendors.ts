import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { InsertVendor, InsertVendorProduct } from "@shared/schema";

export function useVendors() {
  return useQuery({
    queryKey: [api.vendors.list.path],
    queryFn: async () => {
      const res = await fetch(api.vendors.list.path);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return api.vendors.list.responses[200].parse(await res.json());
    },
  });
}

export function useVendor(id: number) {
  return useQuery({
    queryKey: [api.vendors.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.vendors.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch vendor");
      return api.vendors.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVendor) => {
      const res = await fetch(api.vendors.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create vendor");
      return api.vendors.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vendors.list.path] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.vendors.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete vendor");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vendors.list.path] });
    },
  });
}

export function useCreateVendorProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vendorId, ...data }: { vendorId: number } & Omit<InsertVendorProduct, "vendorId">) => {
      const url = buildUrl(api.vendorProducts.create.path, { vendorId });
      // Coerce price to string if it comes as number from form
      const payload = { ...data, price: String(data.price) };
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return api.vendorProducts.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.vendors.get.path, variables.vendorId] });
    },
  });
}
