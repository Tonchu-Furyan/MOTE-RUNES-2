import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import RuneRevealAnimation from "@/components/RuneRevealAnimation";
import RuneCard from "@/components/RuneCard";
import useAuth from "@/hooks/useAuth";
import { useRunes, useHasPulledToday, useLatestUserRunePull } from "@/hooks/useRunes";
import { useToast } from "@/hooks/use-toast";
import { RunePull } from "@/lib/runes";

export default function DailyRune() {
  const { user } = useAuth();
  const { pullRuneMutation } = useRunes();
  const { toast } = useToast();
  
  // Track animation state
  const [isRevealing, setIsRevealing] = useState(false);
  
  const userId = user?.id || null;
  const { data: hasPulledToday, isLoading: checkingPull } = useHasPulledToday(userId);
  const { 
    data: latestPull, 
    isLoading: loadingLatestPull,
    refetch: refetchLatestPull 
  } = useLatestUserRunePull(userId);
  
  // Handler for pulling a new rune
  const handlePullRune = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please login to pull a rune",
      });
      return;
    }
    
    // If already pulled today, we'll just see the rune already in latestPull
    if (hasPulledToday) {
      toast({
        variant: "destructive",
        title: "Already Pulled Today",
        description: "You have already drawn your rune for today.",
      });
      return;
    }
    
    try {
      // Initiate the pull animation first
      setIsRevealing(true);
      
      // Pull the rune
      console.log("Attempting to pull rune with user ID:", userId);
      const result = await pullRuneMutation.mutateAsync(userId);
      console.log("Pull result:", result);
      
      // After pulling, refetch the latest pull data
      await refetchLatestPull();
      
      // Note: animation completion is handled by the RuneRevealAnimation component
      // which will call handleRevealComplete when finished
      
    } catch (error) {
      console.error("Error during rune pull:", error);
      setIsRevealing(false);
      // Error is already handled by the mutation
    }
  };
  
  // Handler for when the reveal animation completes
  const handleRevealComplete = () => {
    setIsRevealing(false);
  };
  
  // Handler for viewing history
  const handleViewHistory = () => {
    document.dispatchEvent(new CustomEvent('changeView', { detail: 'history' }));
  };
  
  // Loading state
  const isLoading = checkingPull || loadingLatestPull;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-gold rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-10">
        <h2 className="font-cinzel text-3xl mb-2">Today's Guidance</h2>
        <p className="text-lightgray max-w-lg mx-auto">
          The Elder Futhark runes offer wisdom for your journey today.
        </p>
      </div>
      
      {/* PULL BUTTON - Only show if haven't pulled today and not in revealing animation */}
      {!hasPulledToday && !isRevealing && (
        <motion.div 
          className="perspective w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center mb-16">
            <div className="relative w-64 h-64 mb-8">
              <motion.div 
                className="rune-circle absolute inset-0"
                animate={{ 
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3 
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-gold rounded-full flex items-center justify-center relative">
                  <div className="w-28 h-28 rounded-full border border-gold/30 flex items-center justify-center">
                    <Sparkles className="text-gold h-6 w-6" />
                  </div>
                  <div className="absolute inset-0 border-t-4 border-gold rounded-full animate-spin-slow opacity-60" />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handlePullRune}
              disabled={pullRuneMutation.isPending}
              className="gold-gradient text-black font-cinzel font-bold py-6 px-12 rounded-lg text-lg shadow-lg hover:scale-105 transition duration-300 rune-glow h-auto"
            >
              {pullRuneMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-black rounded-full border-t-transparent animate-spin mr-2"></div>
              ) : "DRAW YOUR RUNE"}
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* REVEAL ANIMATION - Show during reveal */}
      {isRevealing && latestPull && (
        <RuneRevealAnimation 
          rune={latestPull.rune} 
          onComplete={handleRevealComplete} 
        />
      )}
      
      {/* Loading animation when revealing but no latestPull yet */}
      {isRevealing && !latestPull && (
        <div className="flex items-center justify-center py-16">
          <div className="w-20 h-20 border-4 border-gold rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
      
      {/* DISPLAY PULLED RUNE - Show when not revealing and has pulled today */}
      {!isRevealing && hasPulledToday && latestPull && (
        <RuneCard 
          runePull={latestPull} 
          onViewHistory={handleViewHistory} 
        />
      )}
    </div>
  );
}
