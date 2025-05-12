import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Share2, Sparkles } from "lucide-react";
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
  const [animateRune, setAnimateRune] = useState(false);
  const { toast } = useToast();
  
  const { rune } = runePull;
  const pullDate = new Date(runePull.pullDate);
  
  // Periodically animate the rune symbol for attention
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateRune(true);
      setTimeout(() => setAnimateRune(false), 2000);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleShare = () => {
    const shareText = `Today's MOTE RUNE: ${rune.name} (${rune.meaning}) - ${window.location.origin}`;
    
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
  
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case "common": return "bg-gray-600 text-gray-200";
      case "uncommon": return "bg-green-700 text-green-100";
      case "rare": return "bg-blue-700 text-blue-100";
      case "epic": return "bg-purple-700 text-purple-100";
      case "legendary": return "bg-yellow-600 text-yellow-100";
      default: return "bg-gray-600 text-gray-200";
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence>
        <div className={`rune-card relative ${isFlipped ? 'flipped' : ''}`}>
          {/* FRONT OF CARD */}
          <div className="rune-card-front">
            <motion.div 
              className="border-2 border-gold rounded-xl p-8 text-center relative bg-gradient-to-b from-black to-darkgray h-[450px] flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black px-4 py-1.5 border border-gold/30 rounded-full flex items-center">
                <h3 className="font-cinzel text-gold text-lg mr-2">{rune.name}</h3>
                <span className={`px-2 py-0.5 text-[10px] rounded-full ${getRarityColor(rune.rarity)}`}>
                  {rune.rarity.charAt(0).toUpperCase() + rune.rarity.slice(1)}
                </span>
              </div>
              
              <div className="rune-symbol-container relative mb-6">
                <motion.div 
                  className="absolute inset-0 bg-gold/10 rounded-full opacity-0"
                  animate={animateRune ? {
                    opacity: [0, 0.5, 0],
                    scale: [1, 1.5, 1.8],
                  } : {}}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
                <motion.div 
                  className="text-9xl text-gold font-cinzel mb-2"
                  animate={animateRune ? {
                    scale: [1, 1.1, 1],
                    textShadow: ["0 0 10px rgba(212, 175, 55, 0.5)", "0 0 20px rgba(212, 175, 55, 0.8)", "0 0 10px rgba(212, 175, 55, 0.5)"],
                  } : {}}
                  transition={{ duration: 2 }}
                >
                  {rune.symbol}
                </motion.div>
              </div>
              
              <div className="font-cinzel text-xl text-offwhite mb-8">{rune.meaning}</div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-full max-w-[240px]"
              >
                <button 
                  onClick={() => setIsFlipped(true)}
                  className="w-full text-sm text-gold border border-gold/30 rounded-lg py-2.5 px-4 hover:bg-gold/10 transition duration-300 flex items-center justify-center"
                >
                  <span className="font-medium">READ INTERPRETATION</span>
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </motion.div>
              
              <div className="absolute bottom-4 right-4 text-xs text-lightgray opacity-70 flex items-center">
                <Sparkles className="h-3 w-3 mr-1 text-gold/50" />
                {format(pullDate, 'MMMM d, yyyy')}
              </div>
            </motion.div>
          </div>
          
          {/* BACK OF CARD */}
          <div className="rune-card-back">
            <motion.div 
              className="border-2 border-gold rounded-xl p-8 relative bg-gradient-to-b from-black to-darkgray h-[450px] flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black px-4 py-1.5 border border-gold/30 rounded-full flex items-center">
                <h3 className="font-cinzel text-gold text-lg mr-2">{rune.name}</h3>
                <span className={`px-2 py-0.5 text-[10px] rounded-full ${getRarityColor(rune.rarity)}`}>
                  {rune.rarity.charAt(0).toUpperCase() + rune.rarity.slice(1)}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                <h4 className="text-gold font-cinzel text-lg mb-3">Interpretation</h4>
                <p className="text-offwhite leading-relaxed mb-6">
                  {rune.interpretation}
                </p>
                
                <h4 className="text-gold font-cinzel text-lg mb-3">Guidance</h4>
                <p className="text-offwhite leading-relaxed">
                  {rune.guidance}
                </p>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-full max-w-[240px] self-center mt-2"
              >
                <button 
                  onClick={() => setIsFlipped(false)}
                  className="w-full text-sm text-gold border border-gold/30 rounded-lg py-2.5 px-4 hover:bg-gold/10 transition duration-300 flex items-center justify-center"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  <span className="font-medium">BACK TO RUNE</span>
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </AnimatePresence>
      
      <div className="flex justify-center mt-6">
        <Button 
          onClick={handleShare}
          variant="outline" 
          className="flex items-center text-gold border border-gold/50 rounded-lg px-6 py-5 hover:bg-gold/10 transition duration-300 h-auto"
        >
          <Share2 className="mr-2 h-4 w-4" />
          <span>Share Your Rune</span>
        </Button>
      </div>
    </div>
  );
}
