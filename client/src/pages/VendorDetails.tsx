import { Layout } from "@/components/Layout";
import { useVendor, useCreateVendorProduct } from "@/hooks/use-vendors";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Store, Phone, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVendorProductSchema, type InsertVendorProduct } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function VendorDetails() {
  const [, params] = useRoute("/vendors/:id");
  const id = Number(params?.id);
  const { data: vendor, isLoading } = useVendor(id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Vendor Not Found</h2>
          <Link href="/vendors"><Button className="mt-4">Back to List</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Vendor Details">
      <div className="mb-6">
        <Link href="/vendors" className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vendors
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{vendor.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-slate-500">
              <span className="flex items-center text-sm"><Tag className="w-4 h-4 mr-1.5" /> {vendor.category}</span>
              <span className="flex items-center text-sm"><Phone className="w-4 h-4 mr-1.5" /> {vendor.contact}</span>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Info Card - Could be expanded */}
        {vendor.notes && (
          <Card className="border-none shadow-sm bg-blue-50/50 border-blue-100 border">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Notes</h3>
              <p className="text-slate-700">{vendor.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Services & Products</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Product/Service</DialogTitle>
                </DialogHeader>
                <CreateProductForm vendorId={id} onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6">Item Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right pr-6">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendor.products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">
                      No products listed. Add one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendor.products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium pl-6">{product.name}</TableCell>
                      <TableCell className="text-slate-500">{product.description}</TableCell>
                      <TableCell className="text-right pr-6 font-semibold">${product.price}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function CreateProductForm({ vendorId, onSuccess }: { vendorId: number, onSuccess: () => void }) {
  const { mutate, isPending } = useCreateVendorProduct();
  const form = useForm<Omit<InsertVendorProduct, "vendorId">>({
    resolver: zodResolver(insertVendorProductSchema.omit({ vendorId: true })),
    defaultValues: { name: "", price: undefined, description: "" },
  });

  function onSubmit(data: Omit<InsertVendorProduct, "vendorId">) {
    mutate({ vendorId, ...data }, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl><Input placeholder="Wedding Cake - 3 Tier" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="500.00" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
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
              <FormControl><Textarea placeholder="Details about the item..." {...field} value={field.value || ""} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full mt-2">{isPending ? "Adding..." : "Add Product"}</Button>
      </form>
    </Form>
  );
}
