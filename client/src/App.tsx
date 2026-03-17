import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/context/SettingsContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";

import Dashboard from "@/pages/Dashboard";
import Vendors from "@/pages/Vendors";
import CreateVendor from "@/pages/CreateVendor";
import VendorDetails from "@/pages/VendorDetails";

import Venues from "@/pages/Venues";
import CreateVenue from "@/pages/CreateVenue";
import VenueDetails from "@/pages/VenueDetails";

import Clients from "@/pages/Clients";
import ClientDetails from "@/pages/ClientDetails";
import BudgetPlanner from "@/pages/BudgetPlanner";
import SearchResults from "@/pages/SearchResults";
import Settings from "@/pages/Settings";
import Analytics from "@/pages/Analytics";
import Quotations from "@/pages/Quotations";

function isAuthenticated() {
  return localStorage.getItem("ee_auth") === "1";
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const authed = isAuthenticated();

  if (!authed) {
    if (location !== "/login") navigate("/login");
    return null;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <AuthGuard><Dashboard /></AuthGuard>
      </Route>
      <Route path="/vendors">
        <AuthGuard><Vendors /></AuthGuard>
      </Route>
      <Route path="/vendors/new">
        <AuthGuard><CreateVendor /></AuthGuard>
      </Route>
      <Route path="/vendors/:id">
        <AuthGuard><VendorDetails /></AuthGuard>
      </Route>
      <Route path="/venues">
        <AuthGuard><Venues /></AuthGuard>
      </Route>
      <Route path="/venues/create">
        <AuthGuard><CreateVenue /></AuthGuard>
      </Route>
      <Route path="/venues/:id">
        <AuthGuard><VenueDetails /></AuthGuard>
      </Route>
      <Route path="/clients">
        <AuthGuard><Clients /></AuthGuard>
      </Route>
      <Route path="/clients/:id">
        <AuthGuard><ClientDetails /></AuthGuard>
      </Route>
      <Route path="/quotations">
        <AuthGuard><Quotations /></AuthGuard>
      </Route>
      <Route path="/budget">
        <AuthGuard><BudgetPlanner /></AuthGuard>
      </Route>
      <Route path="/analytics">
        <AuthGuard><Analytics /></AuthGuard>
      </Route>
      <Route path="/search">
        <AuthGuard><SearchResults /></AuthGuard>
      </Route>
      <Route path="/settings">
        <AuthGuard><Settings /></AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
