import { Layout } from "@/components/Layout";
import { useVendors, useDeleteVendor } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import { Plus, Search, Trash2, Phone, Mail, Eye, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent } from "@/components/ui/card";

const ITEMS_PER_PAGE = 8;

const categoryColors: Record<string, string> = {};
const palette = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-sky-100 text-sky-700",
];

function getCategoryColor(cat: string): string {
  if (!categoryColors[cat]) {
    const idx = Object.keys(categoryColors).length % palette.length;
    categoryColors[cat] = palette[idx];
  }
  return categoryColors[cat];
}

export default function Vendors() {
  const { data: vendors, isLoading } = useVendors();
  const deleteVendor = useDeleteVendor();
  const [, navigate] = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const categories = useMemo(() => {
    if (!vendors) return [];
    return Array.from(new Set(vendors.map((v) => v.category)));
  }, [vendors]);

  const filteredVendors = useMemo(() =>
    vendors?.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || v.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [],
    [vendors, searchTerm, selectedCategory],
  );

  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <Layout title="Vendors">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Management</p>
          <h2 className="text-xl font-bold text-slate-900">Vendors</h2>
        </div>
        <Link href="/vendors/new">
          <Button className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-900/20 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search vendors..."
              className="pl-9 h-9 rounded-xl text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-9 w-full sm:w-48 rounded-xl text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Store className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No vendors found</p>
          <p className="text-xs text-slate-400">Try a different search or category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedVendors.map((vendor) => {
            const [phonePart, emailPart] = vendor.contact?.split("|") || [];

            return (
              <div
                key={vendor.id}
                onClick={() => navigate(`/vendors/${vendor.id}`)}
                className="bg-white border border-slate-100 rounded-2xl px-4 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-150 cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors truncate">{vendor.name}</p>
                      <Badge className={`${getCategoryColor(vendor.category)} text-[10px] px-2 py-0 font-semibold mt-0.5`}>
                        {vendor.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact info — hidden on very small screens */}
                  <div className="hidden sm:flex flex-col gap-0.5 text-xs text-slate-400 shrink-0">
                    {phonePart && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />{phonePart.replace("Phone:", "").trim()}
                      </span>
                    )}
                    {emailPart && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />{emailPart.replace("Email:", "").trim()}
                      </span>
                    )}
                  </div>

                  {/* Notes — hidden on mobile */}
                  <div className="hidden lg:block flex-1 text-xs text-slate-400 line-clamp-2 max-w-xs">
                    {vendor.notes || "—"}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/vendors/${vendor.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setDeletingId(vendor.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="rounded-xl h-8 text-xs">
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="rounded-xl h-8 text-xs">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mt-2">Are you sure? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeletingId(null)} className="rounded-xl">Cancel</Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (deletingId) {
                  deleteVendor.mutate(deletingId);
                  setDeletingId(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
