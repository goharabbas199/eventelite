import { Layout } from "@/components/Layout";
import {
  useVendor,
  useCreateVendorProduct,
  useDeleteVendorProduct,
  useUpdateVendor,
} from "@/hooks/use-vendors";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Plus,
  Store,
  Phone,
  Tag,
  Trash2,
  Mail,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/* ===============================
   Product Schema
================================ */

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  currency: z.string().min(1),
  price: z.string().min(1, "Price is required"),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function VendorDetails() {
  const [, params] = useRoute("/vendors/:id");
  const id = Number(params?.id);
  const { data: vendor, isLoading } = useVendor(id);
  const deleteProduct = useDeleteVendorProduct();
  const updateVendor = useUpdateVendor();
  const [phonePart, emailPart] = vendor?.contact?.split("|") || [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  function formatCurrency(amount: number | string) {
    const value = Number(amount);
    if (isNaN(value)) return amount;
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(value);
  }

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-64 w-full rounded-xl" />
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Vendor Not Found</h2>
          <Link href="/vendors">
            <Button className="mt-4">Back to List</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Vendor Details">
      <div className="mb-8 space-y-6">
        <Link
          href="/vendors"
          className="text-sm text-slate-500 hover:text-blue-600 flex items-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vendors
        </Link>

        {/* HEADER CARD */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              {/* LEFT SIDE */}
              <div className="max-w-xl">
                <div className="flex items-center gap-3">
                  <Store className="w-8 h-8 text-blue-600" />
                  <h1 className="text-3xl font-bold tracking-tight">
                    {vendor.name}
                  </h1>
                </div>

                {/* Category */}
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  <Tag className="w-3.5 h-3.5 mr-1" />
                  {vendor.category}
                </div>

                {/* Contact Section */}
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {phonePart && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <a
                        href={`tel:${phonePart.replace("Phone:", "").trim()}`}
                        className="hover:text-blue-600"
                      >
                        {phonePart.replace("Phone:", "").trim()}
                      </a>
                    </div>
                  )}

                  {emailPart && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <a
                        href={`mailto:${emailPart.replace("Email:", "").trim()}`}
                        className="hover:text-blue-600"
                      >
                        {emailPart.replace("Email:", "").trim()}
                      </a>
                    </div>
                  )}
                </div>
              </div>{" "}
              {/* ← THIS WAS MISSING */}
              {/* RIGHT SIDE */}
              <div>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-4">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Vendor</DialogTitle>
                    </DialogHeader>

                    <EditVendorForm
                      vendor={vendor}
                      onClose={() => setIsEditOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services & Products Section */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="flex justify-between items-center px-6 py-4 border-b bg-slate-50">
          <CardTitle className="text-lg font-semibold">
            Services & Products
          </CardTitle>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
              </DialogHeader>

              <CreateProductForm
                vendorId={id}
                onSuccess={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-0">
          {vendor.products?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Store className="w-10 h-10 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">
                No services added yet
              </p>
              <p className="text-sm text-slate-400">
                Use the "Add Item" button above to create your first service.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {vendor.products?.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <p className="font-semibold text-slate-700">
                      {formatCurrency(product.price)}
                    </p>

                    <DeleteProductDialog
                      onDelete={() =>
                        deleteProduct.mutate({
                          vendorId: id,
                          productId: product.id,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end mt-8">
        <Link href="/vendors">
          <Button className="bg-green-600 hover:bg-green-700 text-white">
            Done
          </Button>
        </Link>
      </div>
    </Layout>
  );
}

/* ===============================
      Create Product Form
      ================================ */

function CreateProductForm({
  vendorId,
  onSuccess,
}: {
  vendorId: number;
  onSuccess: () => void;
}) {
  const { mutate, isPending } = useCreateVendorProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      currency: "AED",
      price: "",
      description: "",
    },
  });

  function onSubmit(data: ProductFormValues) {
    mutate(
      {
        vendorId,
        name: data.name,
        price: Number(data.price),
        description: data.description,
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess();
          window.location.reload();
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Service name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (AED)</FormLabel>
              <FormControl>
                <Input placeholder="Enter price" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional details" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Adding..." : "Add Product"}
        </Button>
      </form>
    </Form>
  );
}

/* ===============================
      Delete Dialog
      ================================ */

function DeleteProductDialog({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Product</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ===============================
   Edit Vendor Form
================================ */

function EditVendorForm({
  vendor,
  onClose,
}: {
  vendor: any;
  onClose: () => void;
}) {
  const updateVendor = useUpdateVendor();

  const [phonePart, emailPart] = vendor.contact?.split("|") || [];

  const [name, setName] = useState(vendor.name);
  const [category, setCategory] = useState(vendor.category);
  const [phone, setPhone] = useState(
    phonePart?.replace("Phone:", "").trim() || "",
  );
  const [email, setEmail] = useState(
    emailPart?.replace("Email:", "").trim() || "",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const combinedContact = `Phone: ${phone} | Email: ${email}`;

    updateVendor.mutate(
      {
        id: vendor.id,
        name,
        category,
        contact: combinedContact,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          console.error("Update failed:", err);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div>
        <label className="text-sm font-medium">Vendor Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Category</label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Phone</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
