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
import { Plus, Eye, Trash2, ArrowUp, ArrowDown, Users } from "lucide-react";
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
      color: "bg-gray-100 text-gray-700",
      text: `${Math.abs(daysLeft)} days ago`,
      level: "Overdue",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: "High",
      color: "bg-red-100 text-red-700",
      text: `${daysLeft} days left`,
      level: "High",
    };
  }

  if (daysLeft <= 30) {
    return {
      label: "Medium",
      color: "bg-yellow-100 text-yellow-700",
      text: `${daysLeft} days left`,
      level: "Medium",
    };
  }

  return {
    label: "Low",
    color: "bg-green-100 text-green-700",
    text: `${daysLeft} days left`,
    level: "Low",
  };
}

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "budget" | "priority">(
    "priority",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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

  // ---------------- KPI CALCULATIONS ----------------

  const totalClients = clients?.length || 0;

  const filtersActive =
    filter !== "All" ||
    statusFilter !== "All" ||
    typeFilter !== "All" ||
    search !== "";

  const highPriorityCount =
    clients?.filter((client) => {
      const priority = getPriority(new Date(client.eventDate));
      return priority.level === "High";
    }).length || 0;

  const upcomingCount =
    clients?.filter((client) => {
      const days = differenceInDays(new Date(client.eventDate), new Date());
      return days >= 0 && days <= 30;
    }).length || 0;

  const totalPipelineBudget =
    clients?.reduce((sum, client) => {
      return sum + Number(client.budget || 0);
    }, 0) || 0;

  const filteredClients = clients
    ?.filter((client) => {
      const priority = getPriority(new Date(client.eventDate));

      const matchesPriority = filter === "All" || priority.level === filter;

      const matchesStatus =
        statusFilter === "All" || client.status === statusFilter;

      const matchesType =
        typeFilter === "All" || client.eventType === typeFilter;

      const matchesSearch =
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.eventType.toLowerCase().includes(search.toLowerCase()) ||
        client.status.toLowerCase().includes(search.toLowerCase());

      return matchesPriority && matchesStatus && matchesType && matchesSearch;
    })

    ?.sort((a, b) => {
      let result = 0;

      if (sortBy === "date") {
        result =
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      }

      if (sortBy === "budget") {
        result = Number(a.budget || 0) - Number(b.budget || 0);
      }

      if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = {
          Overdue: 0,
          High: 1,
          Medium: 2,
          Low: 3,
        };

        const aPriority = getPriority(new Date(a.eventDate)).level;
        const bPriority = getPriority(new Date(b.eventDate)).level;

        result = priorityOrder[aPriority] - priorityOrder[bPriority];
      }

      return sortOrder === "asc" ? result : -result;
    });

  const filteredCount = filteredClients?.length || 0;
  const handleExportCSV = () => {
    if (!filteredClients || filteredClients.length === 0) {
      alert("No clients to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Event Date",
      "Event Type",
      "Budget",
      "Status",
    ];

    const rows = filteredClients.map((client) => [
      client.name,
      client.email,
      client.phone,
      format(new Date(client.eventDate), "yyyy-MM-dd"),
      client.eventType,
      client.budget || "0",
      client.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) => row.map((item) => `"${item}"`).join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clients_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="p-6 bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border/60 rounded-2xl">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Total Clients
          </p>
          <p className="text-3xl font-semibold mt-2 tracking-tight">
            {totalClients}
          </p>
        </Card>

        <Card className="p-6 bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border/60 rounded-2xl">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            High Priority
          </p>
          <p className="text-2xl font-bold mt-1 text-red-600">
            {highPriorityCount}
          </p>
        </Card>

        <Card className="p-6 bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border/60 rounded-2xl">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Upcoming (30 days)
          </p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">
            {upcomingCount}
          </p>
        </Card>

        <Card className="p-6 bg-card shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border/60 rounded-2xl">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Pipeline Budget
          </p>
          <p className="text-3xl font-semibold mt-2 tracking-tight">
            ${totalPipelineBudget.toLocaleString()}
          </p>
        </Card>
      </div>

      <Card className="mt-6 shadow-lg border border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <CardTitle>Client List</CardTitle>

            <span className="text-sm text-muted-foreground">
              Showing {filteredCount} of {totalClients}
            </span>

            {filtersActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilter("All");
                  setStatusFilter("All");
                  setTypeFilter("All");
                  setSearch("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Button variant="outline" onClick={handleExportCSV}>
              Export CSV
            </Button>

            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-56"
            />

            {/* Priority Filter */}
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Overdue">Overdue</option>
            </select>

            {/* Status Filter */}
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Lead">Lead</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Type Filter */}
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Wedding">Wedding</option>
              <option value="Corporate">Corporate</option>
              <option value="Birthday">Birthday</option>
              <option value="Engagement">Engagement</option>
              <option value="Conference">Conference</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-4">
          <div className="max-h-[600px] overflow-auto">
            <Table className="border-separate border-spacing-y-3">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead
                    className={`cursor-pointer hover:text-primary ${
                      sortBy === "date" ? "text-primary font-semibold" : ""
                    }`}
                    onClick={() => {
                      if (sortBy === "date") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("date");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortBy === "date" &&
                        (sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer hover:text-primary ${
                      sortBy === "date" ? "text-primary font-semibold" : ""
                    }`}
                    onClick={() => {
                      if (sortBy === "priority") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("priority");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      Priority
                      {sortBy === "priority" &&
                        (sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead
                    className={`text-right cursor-pointer hover:text-primary ${
                      sortBy === "budget" ? "text-primary font-semibold" : ""
                    }`}
                    onClick={() => {
                      if (sortBy === "budget") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("budget");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Budget
                      {sortBy === "budget" &&
                        (sortOrder === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px] text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7} className="py-6">
                        <div className="h-6 w-full bg-muted animate-pulse rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredClients && filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>

                        <div className="space-y-1">
                          <p className="text-lg font-semibold">
                            No clients found
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters or create a new client.
                          </p>
                        </div>

                        <Button
                          onClick={() => {
                            setFilter("All");
                            setStatusFilter("All");
                            setTypeFilter("All");
                            setSearch("");
                          }}
                          variant="outline"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients?.map((client) => {
                    const priority = getPriority(new Date(client.eventDate));

                    return (
                      <TableRow
                        key={client.id}
                        className="bg-background border border-border/60 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer"
                        onClick={() => setLocation(`/clients/${client.id}`)}
                      >
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>

                        <TableCell>
                          {format(new Date(client.eventDate), "MMM dd, yyyy")}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit tracking-wide ${priority.color}`}
                            >
                              {priority.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {priority.text}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>{client.eventType}</TableCell>

                        <TableCell className="text-right font-semibold">
                          {client.budget
                            ? `$${Number(client.budget).toLocaleString()}`
                            : "-"}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full tracking-wide ${
                              client.status === "Lead"
                                ? "bg-gray-100 text-gray-700"
                                : client.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : client.status === "Confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : client.status === "Completed"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {client.status}
                          </span>
                        </TableCell>

                        <TableCell
                          className="flex gap-2 justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
