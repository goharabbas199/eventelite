import { Layout } from "@/components/Layout";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, type InsertClient } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredClients = clients?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Clients">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <CreateClientForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-white border-b px-6 py-4">
          <CardTitle className="text-lg">Client List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Client Name</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients?.map((client) => (
                  <TableRow key={client.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium pl-6 text-slate-900">{client.name}</TableCell>
                    <TableCell className="text-slate-600">{format(new Date(client.eventDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-slate-600">{client.eventType}</TableCell>
                    <TableCell className="font-medium text-slate-900">${Number(client.budget).toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={client.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="icon" className="hover:text-blue-600 hover:bg-blue-50">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Lead: "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-slate-100 text-slate-700 border-slate-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const style = styles[status as keyof typeof styles] || styles.Pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}

function CreateClientForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateClient();
  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "", email: "", phone: "", eventType: "Wedding", budget: 0, status: "Lead", notes: ""
    },
  });

  function onSubmit(data: InsertClient) {
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
          <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="eventDate" render={({ field }) => (
            <FormItem><FormLabel>Event Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={e => field.onChange(new Date(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="budget" render={({ field }) => (
            <FormItem><FormLabel>Budget ($)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="eventType" render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Wedding">Wedding</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Birthday">Birthday</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>
        <Button type="submit" disabled={isPending} className="w-full mt-2 bg-blue-600">{isPending ? "Creating..." : "Create Client"}</Button>
      </form>
    </Form>
  );
}
