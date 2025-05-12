import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DailyRune from "@/pages/DailyRune";
import RuneCounts from "@/pages/RuneCounts";
import Login from "@/pages/Login";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import { AuthKitProvider } from "@farcaster/auth-kit";

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentView, setCurrentView] = useState<string>("daily");
  const [appKey, setAppKey] = useState<number>(0); // Key to force re-render
  
  // Add console log to debug authentication state
  console.log("App rendering, auth state:", { isAuthenticated, isLoading, user });
  
  // Handle view changes
  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };
  
  // Listen for authentication state changes
  useEffect(() => {
    console.log("Auth state changed:", { isAuthenticated, user });
    
    // Force re-render when user logs in
    if (isAuthenticated && user) {
      setAppKey(prev => prev + 1);
    }
  }, [isAuthenticated, user]);
  
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
        <main className="container mx-auto px-4 py-4 flex-1">
          {currentView === "daily" && <DailyRune />}
          {currentView === "history" && <RuneCounts />}
        </main>
        <Navigation activeView={currentView} onViewChange={handleViewChange} />
      </div>
    </TooltipProvider>
  );
}

function App() {
  /**
   * FARCASTER AUTHENTICATION CONFIGURATION
   * 
   * For Farcaster authentication to work properly when deployed:
   * 
   * 1. Register your app on the Farcaster Developer Hub
   *    - Visit: https://hub.farcaster.xyz
   *    - Create a developer account if you don't have one
   *    - Register this app and get the necessary credentials
   * 
   * 2. Ensure you're using the correct relay URL 
   *    - The default "https://relay.farcaster.xyz" works for most cases
   *    - You might need a different relay depending on your setup
   * 
   * 3. Configure your domain settings
   *    - Your app must be deployed on a domain allowed by Farcaster
   *    - Update the domain and siweUri to match your production URL
   * 
   * 4. Provide an app icon 
   *    - The icon will be displayed during the Sign In With Farcaster flow
   *    - Use a square image of at least 200x200 pixels
   */
  const config = {
    // Required from Farcaster Developer Hub
    relay: "https://relay.farcaster.xyz",
    rpcUrl: "https://mainnet.optimism.io", // For mainnet
    domain: window.location.host,
    siweUri: window.location.origin,
    // Production app details
    appName: "Mote Runes",
    appIcon: "/generated-icon.png", // Using the icon in the root directory
  };

  return (
    <AuthKitProvider config={config}>
      <AppContent />
    </AuthKitProvider>
  );
}

export default App;
