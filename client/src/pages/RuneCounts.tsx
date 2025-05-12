import { useState } from "react";
import { ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import { useRuneCountsByUser } from "@/hooks/useRunes";
import RuneCard from "@/components/RuneCard";
import RuneCountItem from "@/components/RuneCountItem";
import { RuneCount } from "@/lib/runes";

export default function RuneCounts() {
  const { user } = useAuth();
  const [selectedRune, setSelectedRune] = useState<RuneCount | null>(null);
  
  const userId = user?.id || null;
  // Use the new hook for rune counts
  const { data: runeCounts = [], isLoading } = useRuneCountsByUser(userId);
  
  const handleBack = () => {
    if (selectedRune) {
      setSelectedRune(null);
    } else {
      // Go back to daily view
      document.dispatchEvent(new CustomEvent('changeView', { detail: 'daily' }));
    }
  };
  
  const handleSelectRune = (runeCount: RuneCount): void => {
    setSelectedRune(runeCount);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-gold rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  // If a rune is selected, show its details
  if (selectedRune) {
    // Create a RunePull-like object from the RuneCount for compatibility with RuneCard
    const runePull = {
      id: 0, // This is just a placeholder
      userId: selectedRune.userId,
      runeId: selectedRune.runeId,
      pullDate: new Date().toISOString(), // This is just a placeholder
      createdAt: selectedRune.lastPulledAt,
      rune: selectedRune.rune
    };
    
    return (
      <div>
        <Button 
          onClick={handleBack}
          variant="ghost"
          className="flex items-center text-gold hover:text-offwhite transition duration-300 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Back to Rune Counts</span>
        </Button>
        
        <div className="mb-4 px-3 py-2 bg-darkgray/50 rounded-md border border-gold/20">
          <p className="text-gold text-sm font-medium">
            You've drawn {selectedRune.rune.name} {selectedRune.count} time{selectedRune.count !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-lightgray">
            First pulled: {new Date(selectedRune.firstPulledAt).toLocaleDateString()}
          </p>
        </div>
        
        <RuneCard 
          runePull={runePull} 
          onViewHistory={handleBack} 
        />
      </div>
    );
  }
  
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="font-cinzel text-3xl mb-2">Your Rune Collection</h2>
        <p className="text-lightgray max-w-lg mx-auto">
          The runes you've collected on your journey. Click any rune to view its full meaning.
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
        
        <Button 
          variant="ghost" 
          size="icon"
          className="text-lightgray hover:text-gold"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      {runeCounts && runeCounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {runeCounts.map((runeCount) => (
            <RuneCountItem 
              key={`${runeCount.userId}-${runeCount.runeId}`} 
              runeCount={runeCount} 
              onClick={() => handleSelectRune(runeCount)}
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