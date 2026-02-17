import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import Vendors from "@/pages/Vendors";
import CreateVendor from "@/pages/CreateVendor";
import VendorDetails from "@/pages/VendorDetails";

import Venues from "@/pages/Venues";
import CreateVenue from "@/pages/CreateVenue"; // ✅ ADD THIS
import VenueDetails from "@/pages/VenueDetails";

import Clients from "@/pages/Clients";
import ClientDetails from "@/pages/ClientDetails";
import BudgetPlanner from "@/pages/BudgetPlanner";
import SearchResults from "@/pages/SearchResults";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      {/* Vendors */}
      <Route path="/vendors" component={Vendors} />
      <Route path="/vendors/new" component={CreateVendor} />
      <Route path="/vendors/:id" component={VendorDetails} />
      {/* Venues */}
      <Route path="/venues" component={Venues} />
      <Route path="/venues/create" component={CreateVenue} /> // 👈 MUST COME
      BEFORE :id
      <Route path="/venues/:id" component={VenueDetails} />
      {/* Clients */}
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={ClientDetails} />
      <Route path="/budget" component={BudgetPlanner} />
      <Route path="/search" component={SearchResults} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
