import { Layout } from "@/components/Layout";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { useQueryClient } from "@tanstack/react-query";
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
import { Plus, Eye, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { useLocation } from "wouter";

function getPriority(eventDate: Date) {
  const today = new Date();
  const daysLeft = differenceInDays(eventDate, today);

  if (daysLeft < 0) {
    return {
      label: "Overdue",
      color: "bg-gray-500",
      text: `${Math.abs(daysLeft)} days ago`,
      level: "Overdue",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: "High",
      color: "bg-red-500",
      text: `${daysLeft} days left`,
      level: "High",
    };
  }

  if (daysLeft <= 30) {
    return {
      label: "Medium",
      color: "bg-yellow-500",
      text: `${daysLeft} days left`,
      level: "Medium",
    };
  }

  return {
    label: "Low",
    color: "bg-green-500",
    text: `${daysLeft} days left`,
    level: "Low",
  };
}

export default function Clients() {
  const { data: clients } = useClients();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [, setLocation] = useLocation();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await fetch(`/api/clients/${deleteId}`, {
        method: "DELETE",
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/clients"],
      });

      setDeleteId(null);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete client");
    }
  };

  const filteredClients = clients
    ?.filter((client) => {
      const priority = getPriority(new Date(client.eventDate));
      if (filter === "All") return true;
      return priority.level === filter;
    })
    ?.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        Overdue: 0,
        High: 1,
        Medium: 2,
        Low: 3,
      };

      const aPriority = getPriority(new Date(a.eventDate)).level;
      const bPriority = getPriority(new Date(b.eventDate)).level;

      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });

  return (
    <Layout title="Clients">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
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

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mt-2">
            Are you sure you want to delete this client? This action cannot be
            undone.
          </p>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Client List</CardTitle>

          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="High">High (0–7 days)</option>
            <option value="Medium">Medium (8–30 days)</option>
            <option value="Low">Low (31+ days)</option>
            <option value="Overdue">Overdue</option>
          </select>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredClients?.map((client) => {
                const priority = getPriority(new Date(client.eventDate));

                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>

                    <TableCell>
                      {format(new Date(client.eventDate), "MMM dd, yyyy")}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-white text-xs px-2 py-1 rounded-md w-fit ${priority.color}`}
                        >
                          {priority.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {priority.text}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{client.eventType}</TableCell>

                    <TableCell>
                      {client.budget
                        ? `$${Number(client.budget).toLocaleString()}`
                        : "-"}
                    </TableCell>

                    <TableCell>{client.status}</TableCell>

                    <TableCell className="flex gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/clients/${client.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(client.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}

/* ------------------ CREATE CLIENT FORM ------------------ */

function CreateClientForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateClient();
  const [, setLocation] = useLocation();

  const [customEventType, setCustomEventType] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    eventType: "Wedding",
    budget: "",
    guestCount: "",
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

    const finalEventType =
      formData.eventType === "Other" && customEventType
        ? customEventType
        : formData.eventType;

    mutate(
      {
        ...formData,
        eventType: finalEventType,
        eventDate: new Date(formData.eventDate),
        budget: formData.budget ? formData.budget : "0",
        guestCount: formData.guestCount
          ? Number(formData.guestCount)
          : undefined,
      },
      {
        onSuccess: (newClient) => {
          setCustomEventType("");
          onSuccess();
          setLocation(`/clients/${newClient.id}`);
        },
      },
    );
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Name *</label>
        <Input
          placeholder="Client Name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email *</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone *</label>
        <Input
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Date *</label>
          <Input
            type="date"
            value={formData.eventDate}
            onChange={(e) => handleChange("eventDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Budget (Optional)</label>
          <Input
            type="number"
            value={formData.budget}
            onChange={(e) => handleChange("budget", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Guest Count</label>
          <Input
            type="number"
            value={formData.guestCount}
            onChange={(e) => handleChange("guestCount", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Event Type</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            value={formData.eventType}
            onChange={(e) => handleChange("eventType", e.target.value)}
          >
            <option value="Wedding">Wedding</option>
            <option value="Corporate">Corporate</option>
            <option value="Birthday">Birthday</option>
            <option value="Engagement">Engagement</option>
            <option value="Conference">Conference</option>
            <option value="Other">Other</option>
          </select>

          {formData.eventType === "Other" && (
            <Input
              placeholder="Enter custom event type"
              value={customEventType}
              onChange={(e) => setCustomEventType(e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (Optional)</label>
        <Input
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Client"}
      </Button>
    </form>
  );
}
