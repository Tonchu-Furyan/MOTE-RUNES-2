import { useState } from "react";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function Login() {
  const { connectWithFarcaster, connectWithWallet, isLoading } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="inline-block mb-6"
          animate={{ 
            scale: [1, 1.05, 1],
            transition: { 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 2
            }
          }}
        >
          <div className="w-32 h-32 mx-auto rune-circle flex items-center justify-center">
            <div className="text-8xl text-gold font-cinzel">ᚠ</div>
          </div>
        </motion.div>
        
        <h2 className="font-cinzel text-3xl mb-2 text-gold">Welcome to Rune Seer</h2>
        <p className="text-lightgray max-w-md mx-auto mb-8">
          Connect with your Farcaster account to receive daily guidance from the Elder Futhark runes.
        </p>
      </motion.div>
      
      <motion.div 
        className="flex flex-col space-y-4 w-full max-w-xs"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Button
          onClick={connectWithFarcaster}
          disabled={isLoading}
          className="bg-darkgray border border-gold text-gold font-medium py-6 rounded-lg hover:bg-gold hover:text-black transition duration-300 h-auto"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gold rounded-full border-t-transparent animate-spin mr-2"></div>
          ) : (
            <svg 
              className="mr-2 h-5 w-5" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M12 7a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H8a1 1 0 110-2h3V8a1 1 0 011-1z" 
                fill="black"
              />
            </svg>
          )}
          Connect with Farcaster
        </Button>
        
        <Button
          onClick={connectWithWallet}
          disabled={isLoading}
          variant="outline"
          className="bg-transparent border border-darkgray text-offwhite font-medium py-6 rounded-lg hover:border-gold hover:text-gold transition duration-300 h-auto"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current rounded-full border-t-transparent animate-spin mr-2"></div>
          ) : (
            <svg 
              className="mr-2 h-5 w-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M7 15h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
          Connect Wallet
        </Button>
      </motion.div>
    </div>
  );
}
