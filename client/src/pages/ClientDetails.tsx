// FULL FILE — COMPLETE WORKING VERSION WITH VENUE SUPPORT

import { Layout } from "@/components/Layout";
import {
  useClient,
  useCreatePlannedService,
  useUpdateClient,
} from "@/hooks/use-clients";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
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
import { ArrowLeft, Plus, Calendar, Mail, Phone, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertPlannedServiceSchema,
  type InsertPlannedService,
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDetails() {
  const [, params] = useRoute("/clients/:id");
  const id = Number(params?.id);

  const { data: client, isLoading } = useClient(id);
  const { data: venues } = useVenues();
  const updateClient = useUpdateClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading)
    return (
      <Layout>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </Layout>
    );

  if (!client) return <Layout>Client not found</Layout>;

  const selectedVenue = venues?.find((v) => v.id === client.venueId);
  const venueCost = selectedVenue ? Number(selectedVenue.basePrice) : 0;

  const totalPlannedCost =
    client.services?.reduce((sum, s) => sum + Number(s.cost), 0) || 0;

  const totalCost = venueCost + totalPlannedCost;

  const budget = client.budget ? Number(client.budget) : 0;
  const remaining = budget - totalCost;

  return (
    <Layout title="Client Profile">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/clients"
            className="text-sm text-slate-500 hover:text-blue-600 flex items-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clients
          </Link>

          <Link href="/clients">
            <Button variant="outline">Done</Button>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {client.name}
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-1">
                <span className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1" /> {client.email}
                </span>
                <span className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1" /> {client.phone}
                </span>
                {client.guestCount && (
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    {client.guestCount} Guests
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Select
              value={client.venueId ? String(client.venueId) : ""}
              onValueChange={(val) =>
                updateClient.mutate({
                  id: client.id,
                  venueId: val ? Number(val) : undefined,
                })
              }
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select Venue" />
              </SelectTrigger>
              <SelectContent>
                {venues?.map((venue) => (
                  <SelectItem key={venue.id} value={String(venue.id)}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                client.status === "Confirmed"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {client.status}
            </span>

            <span className="text-sm text-slate-500 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(client.eventDate), "MMMM dd, yyyy")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SERVICES */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle>Planned Services</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Service</DialogTitle>
                  </DialogHeader>
                  <CreateServiceForm
                    clientId={id}
                    onSuccess={() => setIsDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Service</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVenue && (
                    <TableRow>
                      <TableCell className="font-medium pl-6">
                        Venue — {selectedVenue.name}
                      </TableCell>
                      <TableCell>${venueCost.toLocaleString()}</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  )}

                  {client.services?.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium pl-6">
                        {service.serviceName}
                      </TableCell>
                      <TableCell>
                        ${Number(service.cost).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {service.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {totalCost > 0 && (
                    <TableRow className="bg-slate-50 font-bold border-t-2">
                      <TableCell className="pl-6">Total</TableCell>
                      <TableCell className="text-blue-700">
                        ${totalCost.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* BUDGET */}
        <div>
          <Card className="border-none shadow-md bg-white">
            <CardHeader>
              <CardTitle className="text-base">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between pb-2 border-b">
                  <span className="text-sm text-slate-500">Total Budget</span>
                  <span className="font-bold text-lg">
                    ${budget.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b">
                  <span className="text-sm text-slate-500">Venue Cost</span>
                  <span className="font-bold text-lg">
                    ${venueCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b">
                  <span className="text-sm text-slate-500">Services Cost</span>
                  <span className="font-bold text-lg text-blue-600">
                    ${totalPlannedCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-sm text-slate-500">Remaining</span>
                  <span
                    className={`font-bold text-lg ${
                      remaining < 0 ? "text-red-500" : "text-emerald-600"
                    }`}
                  >
                    ${remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

/* ---------- CREATE SERVICE FORM ---------- */

function CreateServiceForm({
  clientId,
  onSuccess,
}: {
  clientId: number;
  onSuccess: () => void;
}) {
  const { mutate, isPending } = useCreatePlannedService();
  const { data: vendors } = useVendors();

  const form = useForm<Omit<InsertPlannedService, "clientId">>({
    resolver: zodResolver(insertPlannedServiceSchema.omit({ clientId: true })),
    defaultValues: {
      serviceName: "",
      cost: 0,
      vendorId: undefined,
      notes: "",
    },
  });

  function onSubmit(data: any) {
    mutate(
      { clientId, ...data },
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
          name="serviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="Catering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor (Optional)</FormLabel>
              <Select
                value={field.value ? String(field.value) : ""}
                onValueChange={(val) =>
                  field.onChange(val ? Number(val) : undefined)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vendors?.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full mt-2">
          {isPending ? "Adding..." : "Add Service"}
        </Button>
      </form>
    </Form>
  );
}
