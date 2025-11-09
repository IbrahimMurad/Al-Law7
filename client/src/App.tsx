import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import CreateLoo7 from "@/pages/create-loo7";
import StudentDaily from "@/pages/student-daily";
import EvaluateLoo7 from "@/pages/evaluate-loo7";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { indexedDBBackup } from "./lib/indexeddb";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/loo7/create" component={CreateLoo7} />
      <Route path="/student/:id/daily" component={StudentDaily} />
      <Route path="/loo7/:id/evaluate" component={EvaluateLoo7} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const initBackup = async () => {
      try {
        await indexedDBBackup.init();
        
        const response = await fetch("/api/sync");
        if (response.ok) {
          const data = await response.json();
          await indexedDBBackup.syncFromServer(data);
        }
      } catch (error) {
        console.error("Failed to initialize backup:", error);
      }
    };

    initBackup();
    
    const syncInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/sync");
        if (response.ok) {
          const data = await response.json();
          await indexedDBBackup.syncFromServer(data);
        }
      } catch (error) {
        console.error("Failed to sync backup:", error);
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, []);

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
