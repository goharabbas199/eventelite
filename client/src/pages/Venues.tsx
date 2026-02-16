import { Layout } from "@/components/Layout";
import { useVenues, useCreateVenue } from "@/hooks/use-venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVenueSchema, type InsertVenue } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Venues() {
  const { data: venues, isLoading } = useVenues();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Layout title="Venues">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500">Manage your event locations</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Venue</DialogTitle>
            </DialogHeader>
            <CreateVenueForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues?.map(venue => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md overflow-hidden h-full">
                <div className="h-40 bg-slate-200 relative">
                  {/* Placeholder image pattern since no real images */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-slate-400 opacity-50" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-700">
                    Starts at ${venue.basePrice}
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{venue.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center mb-4">
                    <MapPin className="w-3.5 h-3.5 mr-1" /> {venue.location}
                  </p>
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100">
                    <span className="flex items-center text-slate-600">
                      <Users className="w-4 h-4 mr-1.5 text-blue-500" /> 
                      Capacity: {venue.capacity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {venues?.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-muted-foreground">No venues found. Add your first one.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

function CreateVenueForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateVenue();
  const form = useForm<InsertVenue>({
    resolver: zodResolver(insertVenueSchema),
    defaultValues: {
      name: "", location: "", capacity: 0, basePrice: 0, notes: "", extraCharges: ""
    },
  });

  function onSubmit(data: InsertVenue) {
    mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Venue Name</FormLabel><FormControl><Input placeholder="Grand Hall" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="123 Main St, City" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="capacity" render={({ field }) => (
            <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="basePrice" render={({ field }) => (
            <FormItem><FormLabel>Base Price ($)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>Description/Notes</FormLabel><FormControl><Textarea placeholder="A beautiful venue..." {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" disabled={isPending} className="w-full mt-2 bg-blue-600">{isPending ? "Adding..." : "Add Venue"}</Button>
      </form>
    </Form>
  );
}
