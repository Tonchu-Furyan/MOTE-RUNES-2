import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Rune, RunePull } from "@/lib/runes";
import { useToast } from "@/hooks/use-toast";

interface RuneCardProps {
  runePull: RunePull;
  onViewHistory: () => void;
}

export default function RuneCard({ runePull, onViewHistory }: RuneCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();
  
  const { rune } = runePull;
  const pullDate = new Date(runePull.pullDate);
  
  const handleShare = () => {
    const shareText = `Today's rune: ${rune.name} (${rune.meaning}) - ${window.location.origin}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Daily Rune',
        text: shareText,
      }).catch(err => {
        console.error('Error sharing:', err);
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Share your rune with others!",
      });
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`rune-card mb-8 relative h-[400px] ${isFlipped ? 'flipped' : ''}`}>
        <div className="rune-card-front">
          <div className="border-2 border-gold rounded-xl p-10 text-center relative bg-darkgray h-full flex flex-col items-center justify-center">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black px-4 py-1 flex items-center">
              <h3 className="font-cinzel text-gold text-lg mr-2">{rune.name}</h3>
              <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                rune.rarity === "common" ? "bg-gray-600 text-gray-200" :
                rune.rarity === "uncommon" ? "bg-green-700 text-green-100" :
                rune.rarity === "rare" ? "bg-blue-700 text-blue-100" :
                rune.rarity === "epic" ? "bg-purple-700 text-purple-100" :
                "bg-yellow-600 text-yellow-100"
              }`}>
                {rune.rarity.charAt(0).toUpperCase() + rune.rarity.slice(1)}
              </span>
            </div>
            
            <div className="mb-8">
              <div className="text-8xl text-gold font-cinzel mb-4">{rune.symbol}</div>
              <div className="font-cinzel text-xl text-offwhite">{rune.meaning}</div>
            </div>
            
            <button 
              onClick={() => setIsFlipped(true)}
              className="text-sm text-gold hover:text-offwhite transition duration-300 flex items-center"
            >
              <span>READ INTERPRETATION</span>
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
            
            <div className="absolute bottom-5 right-5 text-xs text-lightgray opacity-70">
              {format(pullDate, 'MMMM d, yyyy')}
            </div>
          </div>
        </div>
        
        <div className="rune-card-back">
          <div className="border-2 border-gold rounded-xl p-8 relative bg-darkgray h-full flex flex-col">
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black px-4 py-1 flex items-center">
              <h3 className="font-cinzel text-gold text-lg mr-2">{rune.name}</h3>
              <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                rune.rarity === "common" ? "bg-gray-600 text-gray-200" :
                rune.rarity === "uncommon" ? "bg-green-700 text-green-100" :
                rune.rarity === "rare" ? "bg-blue-700 text-blue-100" :
                rune.rarity === "epic" ? "bg-purple-700 text-purple-100" :
                "bg-yellow-600 text-yellow-100"
              }`}>
                {rune.rarity.charAt(0).toUpperCase() + rune.rarity.slice(1)}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <p className="text-offwhite leading-relaxed mb-4">
                {rune.interpretation}
              </p>
              <p className="text-offwhite leading-relaxed">
                {rune.guidance}
              </p>
            </div>
            
            <button 
              onClick={() => setIsFlipped(false)}
              className="text-sm text-gold hover:text-offwhite transition duration-300 self-center flex items-center"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span>BACK TO RUNE</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-4">
        <Button 
          onClick={handleShare}
          variant="outline" 
          className="flex items-center text-gold border border-gold rounded-lg px-6 py-2 mr-3 hover:bg-gold/10 transition duration-300"
        >
          <Share2 className="mr-2 h-4 w-4" />
          <span>Share</span>
        </Button>
      </div>
    </div>
  );
}
