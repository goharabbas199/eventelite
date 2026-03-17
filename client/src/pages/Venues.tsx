import { Layout } from "@/components/Layout";
import { useVenues, useDeleteVenue } from "@/hooks/use-venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, MapPin, Users, MoreVertical, Pencil, Trash2,
  Search, LayoutGrid, List, Building2, DollarSign,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export default function Venues() {
  const { data: venues, isLoading } = useVenues();
  const deleteVenue = useDeleteVenue();

  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filteredVenues = useMemo(() => {
    if (!venues) return [];
    return venues.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.location.toLowerCase().includes(search.toLowerCase());
      const matchesCapacity = minCapacity ? v.capacity >= Number(minCapacity) : true;
      const matchesPrice = maxPrice ? Number(v.basePrice) <= Number(maxPrice) : true;
      return matchesSearch && matchesCapacity && matchesPrice;
    });
  }, [venues, search, minCapacity, maxPrice]);

  const totalVenues = venues?.length || 0;
  const avgCapacity = venues?.length ? Math.round(venues.reduce((s, v) => s + v.capacity, 0) / venues.length) : 0;
  const avgPrice = venues?.length ? Math.round(venues.reduce((s, v) => s + Number(v.basePrice), 0) / venues.length) : 0;

  return (
    <Layout title="Venues">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Management</p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Venues</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "table" ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>
          <Link href="/venues/create">
            <Button className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-900/20 text-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Venue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Venues", value: totalVenues, icon: Building2, cls: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          { label: "Avg Capacity", value: avgCapacity, icon: Users, cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Avg Base Price", value: `$${avgPrice.toLocaleString()}`, icon: DollarSign, cls: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
        ].map(({ label, value, icon: Icon, cls, bg }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${cls}`} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                <p className={`text-base sm:text-xl font-bold ${cls}`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <Card className="border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm bg-white dark:bg-slate-800/80">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search name or location..."
                className="pl-9 h-9 rounded-xl text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Input
              type="number"
              placeholder="Min capacity"
              className="h-9 rounded-xl text-sm"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max price ($)"
              className="h-9 rounded-xl text-sm"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No venues found</p>
          <p className="text-xs text-slate-400">Try adjusting your filters</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVenues.map((venue) => (
            <Card
              key={venue.id}
              className="group relative border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700 hover:-translate-y-1 transition-all duration-200 rounded-2xl overflow-hidden bg-white dark:bg-slate-800"
            >
              {/* Action menu */}
              <div className="absolute top-3 right-3 z-20" onClick={(e) => e.preventDefault()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-100 dark:border-slate-700 rounded-xl p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
                      <MoreVertical className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <Link href={`/venues/${venue.id}`}>
                      <DropdownMenuItem className="rounded-lg cursor-pointer">
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      onClick={() => setSelectedVenueId(venue.id)}
                      className="text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/venues/${venue.id}`}>
                <div className="cursor-pointer">
                  {/* Image */}
                  <div className="h-44 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-slate-100">
                    {venue.mainImage ? (
                      <img
                        src={venue.mainImage}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm">
                      ${Number(venue.basePrice).toLocaleString()}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {venue.location}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs text-slate-500 font-medium">Capacity: {venue.capacity}</span>
                    </div>
                  </CardContent>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {["Name", "Location", "Capacity", "Base Price", "Actions"].map((h) => (
                  <th key={h} className={`px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVenues.map((venue) => (
                <tr key={venue.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                    <Link href={`/venues/${venue.id}`}>
                      <span className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{venue.name}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{venue.location}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{venue.capacity}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">${Number(venue.basePrice).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition">
                          <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <Link href={`/venues/${venue.id}`}>
                          <DropdownMenuItem className="rounded-lg cursor-pointer">
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => setSelectedVenueId(venue.id)} className="text-red-600 rounded-lg cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete modal */}
      <Dialog open={selectedVenueId !== null} onOpenChange={() => setSelectedVenueId(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Venue</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mt-2">Are you sure? This action cannot be undone.</p>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setSelectedVenueId(null)} className="rounded-xl">Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedVenueId) { deleteVenue.mutate(selectedVenueId); setSelectedVenueId(null); }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
