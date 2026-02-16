import { Layout } from "@/components/Layout";
import { useVenue, useCreateBookingOption } from "@/hooks/use-venues";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, MapPin, Users, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingOptionSchema, type InsertBookingOption } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function VenueDetails() {
  const [, params] = useRoute("/venues/:id");
  const id = Number(params?.id);
  const { data: venue, isLoading } = useVenue(id);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) return <Layout><Skeleton className="h-96 w-full rounded-2xl" /></Layout>;
  if (!venue) return <Layout>Venue not found</Layout>;

  return (
    <Layout title="Venue Details">
      <div className="mb-6">
        <Link href="/venues" className="text-sm text-slate-500 hover:text-blue-600 flex items-center mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Venues
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{venue.name}</h1>
            <p className="text-slate-500 flex items-center mt-2">
              <MapPin className="w-4 h-4 mr-1" /> {venue.location}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Capacity</span>
              <span className="font-bold text-lg flex items-center"><Users className="w-4 h-4 mr-1 text-blue-500" /> {venue.capacity}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Base Price</span>
              <span className="font-bold text-lg text-emerald-600">${venue.basePrice}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Booking Packages</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Package</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Booking Option</DialogTitle></DialogHeader>
                  <CreateOptionForm venueId={id} onSuccess={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Option Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right pr-6">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venue.options?.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No options defined.</TableCell></TableRow>
                  ) : (
                    venue.options?.map((opt) => (
                      <TableRow key={opt.id}>
                        <TableCell className="font-medium pl-6">{opt.name}</TableCell>
                        <TableCell className="text-slate-500">{opt.description}</TableCell>
                        <TableCell className="text-right pr-6 font-semibold">${opt.price}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="border-none shadow-md h-full bg-slate-900 text-white">
            <CardHeader><CardTitle className="text-white">Additional Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-slate-300 mb-1 text-sm uppercase">Notes</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{venue.notes || "No notes available."}</p>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <h4 className="font-medium text-slate-300 mb-1 text-sm uppercase">Extra Charges</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{venue.extraCharges || "None specified."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function CreateOptionForm({ venueId, onSuccess }: { venueId: number, onSuccess: () => void }) {
  const { mutate, isPending } = useCreateBookingOption();
  const form = useForm<Omit<InsertBookingOption, "venueId">>({
    resolver: zodResolver(insertBookingOptionSchema.omit({ venueId: true })),
    defaultValues: { name: "", price: undefined, description: "" },
  });

  function onSubmit(data: any) {
    mutate({ venueId, ...data }, { onSuccess: () => { form.reset(); onSuccess(); } });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Package Name</FormLabel><FormControl><Input placeholder="Full Weekend" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="price" render={({ field }) => (
          <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Includes cleanup..." {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={isPending} className="w-full mt-2">{isPending ? "Adding..." : "Add Option"}</Button>
      </form>
    </Form>
  );
}
