import { Layout } from "@/components/Layout";
import { useVenues, useDeleteVenue } from "@/hooks/use-venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  MapPin,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  LayoutGrid,
  List,
  Building2,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const [availability, setAvailability] = useState("all");

  const filteredVenues = useMemo(() => {
    if (!venues) return [];

    return venues.filter((venue) => {
      const matchesSearch =
        venue.name.toLowerCase().includes(search.toLowerCase()) ||
        venue.location.toLowerCase().includes(search.toLowerCase());

      const matchesCapacity = minCapacity
        ? venue.capacity >= Number(minCapacity)
        : true;

      const matchesPrice = maxPrice
        ? Number(venue.basePrice) <= Number(maxPrice)
        : true;

      const matchesAvailability =
        availability === "all" ? true : availability === "available";

      return (
        matchesSearch && matchesCapacity && matchesPrice && matchesAvailability
      );
    });
  }, [venues, search, minCapacity, maxPrice, availability]);

  const totalVenues = venues?.length || 0;
  const avgCapacity =
    venues && venues.length > 0
      ? Math.round(
          venues.reduce((sum, v) => sum + v.capacity, 0) / venues.length,
        )
      : 0;

  const avgPrice =
    venues && venues.length > 0
      ? Math.round(
          venues.reduce((sum, v) => sum + Number(v.basePrice), 0) /
            venues.length,
        )
      : 0;

  return (
    <Layout title="Venues">
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Venues</h1>
            <p className="text-slate-500 mt-1">
              Manage and organize your event locations efficiently.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-slate-500"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition ${
                  viewMode === "table"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-slate-500"
                }`}
              >
                <List className="w-4 h-4" />
                Table
              </button>
            </div>

            <Link href="/venues/create">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Add Venue
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Venues</p>
              <p className="text-xl font-semibold text-slate-900">
                {totalVenues}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Capacity</p>
              <p className="text-xl font-semibold text-slate-900">
                {avgCapacity}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Base Price</p>
              <p className="text-xl font-semibold text-slate-900">
                ${avgPrice}
              </p>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or location"
                className="pl-9 h-11 rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Input
              type="number"
              placeholder="Min Capacity"
              className="h-11 rounded-xl"
              value={minCapacity}
              onChange={(e) => setMinCapacity(e.target.value)}
            />

            <Input
              type="number"
              placeholder="Max Price"
              className="h-11 rounded-xl"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <select
              className="border border-slate-200 rounded-xl px-3 h-11 text-sm"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="all">All Venues</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>

        {/* CONTENT */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="w-14 h-14 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">
              No matching venues
            </h3>
            <p className="text-slate-500 text-sm mt-2">
              Try adjusting your filters.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <Card
                key={venue.id}
                className="group relative border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:ring-1 hover:ring-blue-200 transition-all duration-300 rounded-2xl overflow-hidden bg-white"
              >
                {/* ACTION MENU */}
                <div className="absolute top-3 right-3 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bg-white shadow-sm border border-slate-200 rounded-lg p-2 hover:bg-slate-50 transition">
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/venues/${venue.id}`}>
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={() => setSelectedVenueId(venue.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Link href={`/venues/${venue.id}`}>
                  <div className="cursor-pointer">
                    {/* IMAGE */}
                    <div className="h-48 relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      {venue.mainImage && (
                        <img
                          src={venue.mainImage}
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {/* PRICE BADGE */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-sm">
                        ${Number(venue.basePrice).toLocaleString()}
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {venue.name}
                        </h3>
                        <p className="text-sm text-slate-500 flex items-center mt-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {venue.location}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100">
                        <span className="flex items-center text-slate-600">
                          <Users className="w-4 h-4 mr-2 text-blue-500" />
                          Capacity: {venue.capacity}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-6 py-4 font-medium">Name</th>
                  <th className="text-left px-6 py-4 font-medium">Location</th>
                  <th className="text-left px-6 py-4 font-medium">Capacity</th>
                  <th className="text-left px-6 py-4 font-medium">
                    Base Price
                  </th>
                  <th className="text-right px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map((venue) => (
                  <tr
                    key={venue.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <Link href={`/venues/${venue.id}`}>
                        <span className="cursor-pointer hover:text-blue-600">
                          {venue.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {venue.location}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {venue.capacity}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      ${Number(venue.basePrice).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-slate-100 rounded-lg">
                            <MoreVertical className="w-4 h-4 text-slate-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/venues/${venue.id}`}>
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => setSelectedVenueId(venue.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
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

        {/* DELETE MODAL */}
        <Dialog
          open={selectedVenueId !== null}
          onOpenChange={() => setSelectedVenueId(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Venue</DialogTitle>
            </DialogHeader>

            <p className="text-slate-600 text-sm mt-2">
              Are you sure you want to delete this venue? This action cannot be
              undone.
            </p>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setSelectedVenueId(null)}
              >
                Cancel
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (selectedVenueId) {
                    deleteVenue.mutate(selectedVenueId);
                    setSelectedVenueId(null);
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
