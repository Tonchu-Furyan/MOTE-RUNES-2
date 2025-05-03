import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import RuneRevealAnimation from "@/components/RuneRevealAnimation";
import RuneCard from "@/components/RuneCard";
import useAuth from "@/hooks/useAuth";
import { useRunes } from "@/hooks/useRunes";
import { useToast } from "@/hooks/use-toast";
import { RunePull } from "@/lib/runes";

export default function DailyRune() {
  const { user } = useAuth();
  const { getLatestUserRunePull, getHasPulledToday, pullRuneMutation } = useRunes();
  const { toast } = useToast();
  
  const [isRevealing, setIsRevealing] = useState(false);
  
  const userId = user?.id || null;
  const { data: hasPulledToday, isLoading: checkingPull } = getHasPulledToday(userId);
  const { 
    data: latestPull, 
    isLoading: loadingLatestPull,
    refetch: refetchLatestPull 
  } = getLatestUserRunePull(userId);
  
  const handlePullRune = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please login to pull a rune",
      });
      return;
    }
    
    if (hasPulledToday) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: "You have already pulled a rune today. Return tomorrow for new wisdom.",
      });
      return;
    }
    
    setIsRevealing(true);
    
    try {
      await pullRuneMutation.mutateAsync(userId);
      // The animation will be handled by the component
    } catch (error) {
      setIsRevealing(false);
      // Error is already handled by the mutation
    }
  };
  
  const handleRevealComplete = () => {
    setIsRevealing(false);
    refetchLatestPull();
  };
  
  const handleViewHistory = () => {
    // This will be handled by the parent component via props
    // For now, we'll just use a placeholder
    document.dispatchEvent(new CustomEvent('changeView', { detail: 'history' }));
  };
  
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
      
      {/* Pre-pull state */}
      {!isRevealing && !hasPulledToday && (
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
      
      {/* Rune reveal animation */}
      {isRevealing && latestPull && (
        <RuneRevealAnimation 
          rune={latestPull.rune} 
          onComplete={handleRevealComplete} 
        />
      )}
      
      {/* Post-pull state */}
      {!isRevealing && hasPulledToday && latestPull && (
        <RuneCard 
          runePull={latestPull} 
          onViewHistory={handleViewHistory} 
        />
      )}
    </div>
  );
}
