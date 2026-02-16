import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/Dashboard";
import Vendors from "@/pages/Vendors";
import VendorDetails from "@/pages/VendorDetails";
import Venues from "@/pages/Venues";
import VenueDetails from "@/pages/VenueDetails";
import Clients from "@/pages/Clients";
import ClientDetails from "@/pages/ClientDetails";
import BudgetPlanner from "@/pages/BudgetPlanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/vendors/:id" component={VendorDetails} />
      <Route path="/venues" component={Venues} />
      <Route path="/venues/:id" component={VenueDetails} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id" component={ClientDetails} />
      <Route path="/budget" component={BudgetPlanner} />
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
