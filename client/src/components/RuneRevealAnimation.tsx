import { motion } from "framer-motion";
import { useEffect } from "react";
import { Rune } from "@/lib/runes";

interface RuneRevealAnimationProps {
  rune: Rune;
  onComplete: () => void;
}

export default function RuneRevealAnimation({ rune, onComplete }: RuneRevealAnimationProps) {
  useEffect(() => {
    // Complete the animation after 2 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="perspective w-full max-w-md mx-auto">
      <div className="flex flex-col items-center">
        <motion.div 
          className="w-64 h-64 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: [0.5, 1.1, 1],
            transition: { duration: 1.2, ease: "easeOut" }
          }}
        >
          <motion.div
            className="text-8xl text-gold font-cinzel"
            initial={{ opacity: 0, rotateY: 0 }}
            animate={{ 
              opacity: 1, 
              rotateY: 360,
              transition: { duration: 1, delay: 0.3 } 
            }}
          >
            {rune.symbol}
          </motion.div>
        </motion.div>
        
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, delay: 1 } 
          }}
        >
          <h3 className="font-cinzel text-gold text-2xl">{rune.name}</h3>
          <p className="text-lightgray">{rune.meaning}</p>
        </motion.div>
      </div>
    </div>
  );
}
