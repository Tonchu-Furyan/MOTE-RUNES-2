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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<string>("daily");
  const [appKey, setAppKey] = useState<number>(0); // Key to force re-render
  
  // Add console log to debug authentication state
  console.log("App rendering, auth state:", { isAuthenticated, isLoading, user });
  
  // Handle view changes
  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };
  
  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      console.log("Logout event detected, resetting app state");
      setCurrentView('daily');
      // Force app to re-render completely
      setAppKey(prev => prev + 1);
    };
    
    document.addEventListener('userLogout', handleLogout);
    
    return () => {
      document.removeEventListener('userLogout', handleLogout);
    };
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gold rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    // Reset to daily view when showing login page
    if (currentView !== "daily") {
      setCurrentView("daily");
    }
    
    console.log("Rendering login page, user not authenticated");
    
    return (
      <TooltipProvider>
        <Toaster />
        <Login />
      </TooltipProvider>
    );
  }
  
  // Authenticated - show main app with key to force fresh render
  console.log("Rendering main app, user authenticated");
  return (
    <TooltipProvider key={appKey}>
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
