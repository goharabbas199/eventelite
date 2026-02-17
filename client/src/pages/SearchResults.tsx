import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { useVendors } from "@/hooks/use-vendors";
import { useVenues } from "@/hooks/use-venues";
import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchResults() {
  const params = new URLSearchParams(window.location.search);
  const rawSearch = params.get("q") || "";
  const search = rawSearch.trim().toLowerCase();

  const { data: vendors } = useVendors();
  const { data: venues } = useVenues();
  const { data: clients } = useClients();

  if (!search) {
    return (
      <Layout title="Search Results">
        <div className="text-muted-foreground">Please enter a search term.</div>
      </Layout>
    );
  }

  const filteredVendors =
    vendors?.filter(
      (v) =>
        v.name.toLowerCase().includes(search) ||
        v.category.toLowerCase().includes(search) ||
        v.contact.toLowerCase().includes(search) ||
        (v.notes?.toLowerCase().includes(search) ?? false),
    ) || [];

  const filteredVenues =
    venues?.filter(
      (v) =>
        v.name.toLowerCase().includes(search) ||
        v.location.toLowerCase().includes(search) ||
        (v.notes?.toLowerCase().includes(search) ?? false),
    ) || [];

  const filteredClients =
    clients?.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search) ||
        c.eventType.toLowerCase().includes(search) ||
        c.status.toLowerCase().includes(search),
    ) || [];

  const hasResults =
    filteredVendors.length > 0 ||
    filteredVenues.length > 0 ||
    filteredClients.length > 0;

  return (
    <Layout title="Search Results">
      <div className="space-y-8">
        <h2 className="text-lg font-semibold">
          Results for: <span className="text-blue-600">"{rawSearch}"</span>
        </h2>

        {!hasResults && (
          <div className="text-muted-foreground">No results found.</div>
        )}

        {/* Vendors */}
        {filteredVendors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vendors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredVendors.map((vendor) => (
                <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                  <div className="p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {vendor.category}
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Venues */}
        {filteredVenues.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Venues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredVenues.map((venue) => (
                <Link key={venue.id} href={`/venues/${venue.id}`}>
                  <div className="p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                    <div className="font-medium">{venue.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {venue.location}
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Clients */}
        {filteredClients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Clients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <div className="p-3 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.eventType} • {client.status}
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
