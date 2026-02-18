import { Layout } from "@/components/Layout";
import { useVenues, useDeleteVenue } from "@/hooks/use-venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Users, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function Venues() {
  const { data: venues, isLoading } = useVenues();
  const deleteVenue = useDeleteVenue();

  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);

  return (
    <Layout title="Venues">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500">Manage your event locations</p>

        <Link href="/venues/create">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Venue
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues?.map((venue) => (
            <Card
              key={venue.id}
              className="group relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md overflow-hidden h-full"
            >
              {/* DELETE BUTTON */}
              <button
                onClick={() => setSelectedVenueId(venue.id)}
                className="absolute top-3 right-3 bg-white shadow-md rounded-full p-2 hover:bg-red-50 transition z-10"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>

              <Link href={`/venues/${venue.id}`}>
                <div className="cursor-pointer">
                  {/* IMAGE */}
                  <div className="h-40 relative overflow-hidden">
                    {venue.mainImage ? (
                      <img
                        src={venue.mainImage}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-slate-400 opacity-50" />
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-700">
                      Starts at ${venue.basePrice}
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {venue.name}
                    </h3>

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
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Dialog
        open={selectedVenueId !== null}
        onOpenChange={() => setSelectedVenueId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Delete Venue
            </DialogTitle>
          </DialogHeader>

          <p className="text-slate-600 text-sm mt-2">
            Are you sure you want to delete this venue? This action cannot be
            undone.
          </p>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setSelectedVenueId(null)}>
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
    </Layout>
  );
}
