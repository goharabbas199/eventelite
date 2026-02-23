import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertVendor, InsertVendorProduct } from "@shared/schema";

/* ===============================
   Vendors
================================ */

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
    queryKey: ["vendor", id], // ✅ SIMPLE KEY
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

/* ===============================
   Vendor Products
================================ */

export function useCreateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      ...data
    }: { vendorId: number } & Omit<InsertVendorProduct, "vendorId">) => {
      const url = buildUrl(api.vendorProducts.create.path, { vendorId });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Create product failed:", errorText);
        throw new Error("Failed to create product");
      }

      return await res.json();
    },

    onSuccess: async (_, variables) => {
      await queryClient.refetchQueries({
        queryKey: ["vendor", variables.vendorId],
      });
    },
  });
}

/* NEW: Delete Product */

export function useDeleteVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      productId,
    }: {
      vendorId: number;
      productId: number;
    }) => {
      const res = await fetch(`/api/vendor-products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete product");
    },

    onSuccess: (_, variables) => {
      // ✅ This MUST match useVendor queryKey
      queryClient.invalidateQueries({
        queryKey: ["vendor", variables.vendorId],
      });
    },
  });
}

/* NEW: Update Product */

export function useUpdateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      productId,
      ...data
    }: {
      vendorId: number;
      productId: number;
    } & Omit<InsertVendorProduct, "vendorId">) => {
      const url = buildUrl(api.vendorProducts.update.path, {
        vendorId,
        productId,
      });

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: String(data.price),
        }),
      });

      if (!res.ok) throw new Error("Failed to update product");

      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.vendors.get.path, variables.vendorId],
      });
    },
  });
}
