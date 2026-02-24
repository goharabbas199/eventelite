import { Layout } from "@/components/Layout";
import { useVendors, useDeleteVendor } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Vendors() {
  const { data: vendors, isLoading } = useVendors();
  const deleteVendor = useDeleteVendor();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    if (!vendors) return [];
    return Array.from(new Set(vendors.map((v) => v.category)));
  }, [vendors]);

  const filteredVendors =
    vendors?.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || v.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }) || [];

  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-purple-100 text-purple-700",
      "bg-orange-100 text-orange-700",
      "bg-pink-100 text-pink-700",
    ];

    const index =
      category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;

    return colors[index];
  };

  return (
    <Layout title="Vendors">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-52 bg-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link href="/vendors/new">
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </Link>
        </div>

        {/* Vendor List */}
        {isLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : filteredVendors.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            No vendors found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVendors.map((vendor) => {
              const [phonePart, emailPart] = vendor.contact?.split("|") || [];

              return (
                <div
                  key={vendor.id}
                  className="bg-white border border-slate-300 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    {/* LEFT */}
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-sm text-slate-900">
                          {vendor.name}
                        </h3>
                        <Badge
                          className={`${getCategoryColor(
                            vendor.category,
                          )} text-xs px-2 py-0.5`}
                        >
                          {vendor.category}
                        </Badge>
                      </div>

                      {phonePart && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {phonePart.replace("Phone:", "").trim()}
                        </div>
                      )}

                      {emailPart && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {emailPart.replace("Email:", "").trim()}
                        </div>
                      )}
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-2">
                      <Link href={`/vendors/${vendor.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-3"
                        >
                          View
                        </Button>
                      </Link>

                      <DeleteVendorDialog
                        onDelete={() => deleteVendor.mutate(vendor.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

/* ================= DELETE DIALOG ================= */

function DeleteVendorDialog({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="h-8 text-xs px-3">
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Vendor</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this vendor?
        </p>

        <div className="flex justify-end gap-2 pt-4">
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
