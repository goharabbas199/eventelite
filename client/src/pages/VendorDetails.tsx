import { Layout } from "@/components/Layout";
import {
  useVendor,
  useCreateVendorProduct,
  useDeleteVendorProduct,
} from "@/hooks/use-vendors";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Store, Phone, Tag, Trash2 } from "lucide-react";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/vendors"
          className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vendors
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-slate-500">
              <span className="flex items-center text-sm">
                <Tag className="w-4 h-4 mr-1.5" /> {vendor.category}
              </span>
              <span className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-1.5" /> {vendor.contact}
              </span>
            </div>
          </div>
          <Store className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Products */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Services & Products</CardTitle>

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {vendor.products?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center h-32 text-muted-foreground"
                  >
                    No products added.
                  </TableCell>
                </TableRow>
              ) : (
                vendor.products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="pl-6 font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell className="text-right">
                      {product.price}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DeleteProductDialog
                        onDelete={() =>
                          deleteProduct.mutate({
                            vendorId: id,
                            productId: product.id,
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
      currency: "USD",
      price: "",
      description: "",
    },
  });

  function onSubmit(data: ProductFormValues) {
    mutate(
      {
        vendorId,
        name: data.name,
        price: `${data.currency} ${data.price}`, // FIXED HERE
        description: data.description,
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess();
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full border rounded-md h-10 px-3"
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="Enter price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
