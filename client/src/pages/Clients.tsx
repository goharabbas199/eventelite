import { Layout } from "@/components/Layout";
import { useClients, useCreateClient } from "@/hooks/use-clients";
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
import { Plus, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function Clients() {
  const { data: clients } = useClients();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <Layout title="Clients">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-new-client">
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <CreateClientForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Client List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {clients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium text-client-name-{client.id}">{client.name}</TableCell>
                  <TableCell>
                    {format(new Date(client.eventDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{client.eventType}</TableCell>
                  <TableCell>
                    {client.budget
                      ? `$${Number(client.budget).toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell>{client.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-view-client-${client.id}`}
                      onClick={() => setLocation(`/clients/${client.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}

function CreateClientForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateClient();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    eventType: "Wedding",
    budget: "",
    status: "Lead",
    notes: "",
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.eventDate
    ) {
      alert("Please fill all required fields");
      return;
    }

    mutate(
      {
        ...formData,
        eventDate: new Date(formData.eventDate),
        budget: formData.budget ? formData.budget : "0",
      },
      {
        onSuccess: (newClient) => {
          onSuccess();
          setLocation(`/clients/${newClient.id}`);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name *</label>
        <Input
          placeholder="Client Name"
          data-testid="input-client-name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email *</label>
        <Input
          placeholder="Email Address"
          type="email"
          data-testid="input-client-email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone *</label>
        <Input
          placeholder="Phone Number"
          data-testid="input-client-phone"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Date *</label>
          <Input
            type="date"
            data-testid="input-client-date"
            value={formData.eventDate}
            onChange={(e) => handleChange("eventDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Budget</label>
          <Input
            placeholder="e.g. 5000"
            type="number"
            data-testid="input-client-budget"
            value={formData.budget}
            onChange={(e) => handleChange("budget", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Type</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            data-testid="select-event-type"
            value={formData.eventType}
            onChange={(e) => handleChange("eventType", e.target.value)}
          >
            <option value="Wedding">Wedding</option>
            <option value="Corporate">Corporate</option>
            <option value="Birthday">Birthday</option>
            <option value="Engagement">Engagement</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            data-testid="select-client-status"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="Lead">Lead</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full" 
        disabled={isPending}
        data-testid="button-create-client"
      >
        {isPending ? "Creating..." : "Create Client"}
      </Button>
    </div>
  );
}
