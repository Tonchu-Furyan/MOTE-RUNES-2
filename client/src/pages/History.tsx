import { useState } from "react";
import { ArrowLeft, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import RuneHistoryItem from "@/components/RuneHistoryItem";
import useAuth from "@/hooks/useAuth";
import { useRunes } from "@/hooks/useRunes";
import RuneCard from "@/components/RuneCard";
import { RunePull } from "@/lib/runes";

export default function History() {
  const { user } = useAuth();
  const { getUserRunePulls } = useRunes();
  const [selectedPull, setSelectedPull] = useState<RunePull | null>(null);
  
  const userId = user?.id || null;
  const { data: runePulls, isLoading } = getUserRunePulls(userId);
  
  const handleBack = () => {
    if (selectedPull) {
      setSelectedPull(null);
    } else {
      // Go back to daily view
      document.dispatchEvent(new CustomEvent('changeView', { detail: 'daily' }));
    }
  };
  
  const handleSelectPull = (pull: RunePull) => {
    setSelectedPull(pull);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-gold rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  if (selectedPull) {
    return (
      <div>
        <Button 
          onClick={handleBack}
          variant="ghost"
          className="flex items-center text-gold hover:text-offwhite transition duration-300 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Back to History</span>
        </Button>
        
        <RuneCard 
          runePull={selectedPull} 
          onViewHistory={handleBack} 
        />
      </div>
    );
  }
  
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-cinzel text-3xl mb-2">Your Rune Journey</h2>
        <p className="text-lightgray max-w-lg mx-auto">
          Review your past rune readings and their guidance.
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={handleBack}
          variant="ghost"
          className="flex items-center text-gold hover:text-offwhite transition duration-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Back to Today</span>
        </Button>
        
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-lightgray hover:text-gold mr-3"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-lightgray hover:text-gold"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {runePulls && runePulls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {runePulls.map((pull) => (
            <RuneHistoryItem 
              key={pull.id} 
              runePull={pull} 
              onClick={() => handleSelectPull(pull)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-lightgray">
            You haven't pulled any runes yet. Start your journey by pulling your first rune.
          </p>
          <Button 
            onClick={handleBack}
            variant="outline" 
            className="mt-4 border-gold text-gold hover:bg-gold/10"
          >
            Pull Your First Rune
          </Button>
        </div>
      )}
    </div>
  );
}
