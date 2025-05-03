import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DailyRune from "@/pages/DailyRune";
import History from "@/pages/History";
import Login from "@/pages/Login";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>("daily");
  
  // Handle view changes
  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };
  
  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      setCurrentView('daily');
    };
    
    document.addEventListener('userLogout', handleLogout);
    
    return () => {
      document.removeEventListener('userLogout', handleLogout);
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gold rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  // If not authenticated or loading just completed and user is null, show login page
  if (!isAuthenticated) {
    // Reset to daily view when showing login page
    if (currentView !== "daily") {
      setCurrentView("daily");
    }
    
    return (
      <TooltipProvider>
        <Toaster />
        <Login />
      </TooltipProvider>
    );
  }
  
  // If authenticated, show app with navigation
  return (
    <TooltipProvider>
      <Toaster />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          {currentView === "daily" && <DailyRune />}
          {currentView === "history" && <History />}
        </main>
        <Navigation activeView={currentView} onViewChange={handleViewChange} />
      </div>
    </TooltipProvider>
  );
}

export default App;
