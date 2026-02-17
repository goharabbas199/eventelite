import { Layout } from "@/components/Layout";
import { useVenues } from "@/hooks/use-venues";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Users } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Venues() {
  const { data: venues, isLoading } = useVenues();

  return (
    <Layout title="Venues">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500">Manage your event locations</p>

        {/* ✅ Now navigates to new page instead of popup */}
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
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md overflow-hidden h-full">
                <div className="h-40 bg-slate-200 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-slate-400 opacity-50" />
                  </div>

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
              </Card>
            </Link>
          ))}

          {venues?.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-muted-foreground">
                No venues found. Add your first one.
              </p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
