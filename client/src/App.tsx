import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Funnel pages
// TASK 4   LeadCapture removed; "/" now routes directly to VslPage
import VslPage from "./pages/VslPage";
import QualifyPage from "./pages/QualifyPage";
import BookingPage from "./pages/BookingPage";
import ConfirmationPage from "./pages/ConfirmationPage";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      {/* Funnel flow   Task 4: traffic goes straight to VSL page */}
      <Route path="/" component={VslPage} />
      <Route path="/vsl" component={VslPage} />
      <Route path="/qualify" component={QualifyPage} />
      <Route path="/booking" component={BookingPage} />
      <Route path="/confirmation" component={ConfirmationPage} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
