import { motion } from "framer-motion";
import { useEffect } from "react";
import { Sparkles, Star } from "lucide-react";
import { Rune } from "@/lib/runes";

interface RuneRevealAnimationProps {
  rune: Rune;
  onComplete: () => void;
}

export default function RuneRevealAnimation({ rune, onComplete }: RuneRevealAnimationProps) {
  // Get appropriate color based on rarity
  const getRarityColor = () => {
    switch(rune.rarity) {
      case "common": return "text-gray-200";
      case "uncommon": return "text-green-300";
      case "rare": return "text-blue-300";
      case "epic": return "text-purple-300";
      case "legendary": return "text-yellow-300";
      default: return "text-gold";
    }
  };
  
  // Get appropriate glow effect based on rarity
  const getRarityGlow = () => {
    switch(rune.rarity) {
      case "common": return "shadow-glow-gray";
      case "uncommon": return "shadow-glow-green";
      case "rare": return "shadow-glow-blue";
      case "epic": return "shadow-glow-purple";
      case "legendary": return "shadow-glow-gold";
      default: return "shadow-glow";
    }
  };
  
  useEffect(() => {
    // Complete the animation after 3.5 seconds - longer time for a more satisfying reveal
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="perspective w-full max-w-md mx-auto">
      <div className="flex flex-col items-center">
        {/* Particle effects */}
        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Spinning outer circle */}
          <motion.div 
            className="absolute w-full h-full rounded-full border-2 border-gold opacity-30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Spinning inner circle (opposite direction) */}
          <motion.div 
            className="absolute w-3/4 h-3/4 rounded-full border border-gold opacity-20"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Rune symbol */}
          <motion.div
            className={`text-8xl ${getRarityColor()} font-cinzel ${getRarityGlow()}`}
            initial={{ opacity: 0, scale: 0, rotateY: 0 }}
            animate={{ 
              opacity: 1, 
              scale: [0, 1.2, 1],
              rotateY: 360,
              transition: { 
                opacity: { duration: 0.5, delay: 1 },
                scale: { duration: 1.2, delay: 1, ease: "easeOut" },
                rotateY: { duration: 1.5, delay: 1 }
              } 
            }}
          >
            {rune.symbol}
          </motion.div>
          
          {/* Animated sparkles that come in from sides */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Top sparkle */}
            <motion.div 
              className="absolute" 
              initial={{ top: -20, left: "50%", x: "-50%" }}
              animate={{ top: "30%" }}
              transition={{ duration: 1.5, delay: 1.2 }}
            >
              <Star className="text-gold h-6 w-6" />
            </motion.div>
            
            {/* Right sparkle */}
            <motion.div 
              className="absolute" 
              initial={{ top: "50%", right: -20, y: "-50%" }}
              animate={{ right: "30%" }}
              transition={{ duration: 1.5, delay: 1.5 }}
            >
              <Sparkles className="text-gold h-5 w-5" />
            </motion.div>
            
            {/* Bottom sparkle */}
            <motion.div 
              className="absolute" 
              initial={{ bottom: -20, left: "50%", x: "-50%" }}
              animate={{ bottom: "30%" }}
              transition={{ duration: 1.5, delay: 1.8 }}
            >
              <Star className="text-gold h-6 w-6" />
            </motion.div>
            
            {/* Left sparkle */}
            <motion.div 
              className="absolute" 
              initial={{ top: "50%", left: -20, y: "-50%" }}
              animate={{ left: "30%" }}
              transition={{ duration: 1.5, delay: 2.1 }}
            >
              <Sparkles className="text-gold h-5 w-5" />
            </motion.div>
          </div>
        </div>
        
        {/* Rune name and meaning with fade-in animation */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, delay: 2.5 } 
          }}
        >
          <h3 className="font-cinzel text-gold text-2xl">{rune.name}</h3>
          <p className="text-lightgray">{rune.meaning}</p>
          <motion.div 
            className={`mt-2 px-2 py-0.5 text-xs rounded-full inline-block ${
              rune.rarity === "common" ? "bg-gray-600 text-gray-200" :
              rune.rarity === "uncommon" ? "bg-green-700 text-green-100" :
              rune.rarity === "rare" ? "bg-blue-700 text-blue-100" :
              rune.rarity === "epic" ? "bg-purple-700 text-purple-100" :
              "bg-yellow-600 text-yellow-100"
            }`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { duration: 0.3, delay: 3 } 
            }}
          >
            {rune.rarity.charAt(0).toUpperCase() + rune.rarity.slice(1)}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
