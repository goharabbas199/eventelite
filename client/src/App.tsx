import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
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
import Events from "@/pages/Events";
import Calendar from "@/pages/Calendar";
import Invoices from "@/pages/Invoices";
import AIAssistant from "@/pages/AIAssistant";
import ClientPortal from "@/pages/ClientPortal";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-9 h-9 border-2 border-indigo-600/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
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
      <Route path="/events">
        <AuthGuard><Events /></AuthGuard>
      </Route>
      <Route path="/calendar">
        <AuthGuard><Calendar /></AuthGuard>
      </Route>
      <Route path="/invoices">
        <AuthGuard><Invoices /></AuthGuard>
      </Route>
      <Route path="/ai">
        <AuthGuard><AIAssistant /></AuthGuard>
      </Route>
      <Route path="/portal/:id" component={ClientPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
