import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import Index from "./pages/Index";
import BudgetDetail from "./pages/BudgetDetail/BudgetDetail";
import NotFound from "./pages/NotFound";
import { UserProvider } from "./context/UserContext";
import AuthGuard from "./pages/AuthGuard";
import Market from "./pages/LM/Market";
import GoalDetail from "./pages/LM/GoalDetail";
import CompareBudgets from "./pages/CompareBudgets";

const queryClient = new QueryClient();

const App = () => (
  <UserProvider>
    <AuthGuard>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BudgetProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/budget/:id" element={<BudgetDetail />} />
                <Route path="/market" element={<Market />} />
                <Route path="/goaldetail/:id" element={<GoalDetail />} />
                <Route path="/compare" element={<CompareBudgets />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </BudgetProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthGuard>
  </UserProvider>
);

export default App;
