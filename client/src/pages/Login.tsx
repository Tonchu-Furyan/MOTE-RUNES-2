import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useHasPulledToday } from "@/hooks/useRunes";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pullDailyRune } from "@/lib/runes";
import { SignInButton } from "@farcaster/auth-kit";

export default function Login() {
  const { connectWithFarcaster, connectWithWallet, loginWithTestUser, isLoading, isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get has pulled today status directly
  const hasPulledTodayQuery = useHasPulledToday(user?.id || null);
  const hasPulled = hasPulledTodayQuery.data;
  
  // Create pull rune mutation
  const pullRuneMutation = useMutation({
    mutationFn: (userId: number) => {
      console.log('pullRuneMutation executing with userId:', userId);
      return pullDailyRune(userId);
    },
    onSuccess: (data) => {
      console.log('Rune pull mutation succeeded with data:', data);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/rune-pulls/user', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/rune-pulls/user/latest', data.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/rune-pulls/user/check-today', data.userId] });
      
      toast({
        title: 'Rune Pulled Successfully',
        description: `You pulled ${data.rune.name}`,
      });
    },
    onError: (error) => {
      console.error('Rune pull mutation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to pull rune',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });
  
  // Function to handle rune pull
  const handlePullRune = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to pull a rune. Please reconnect your account.",
      });
      return;
    }
    
    console.log('Attempting to pull rune with user ID:', user.id);
    
    try {
      const result = await pullRuneMutation.mutateAsync(user.id);
      console.log('Rune pull successful:', result);
      
      // Navigate to daily rune view after pull
      document.dispatchEvent(new CustomEvent('changeView', { detail: 'daily' }));
    } catch (error) {
      console.error('Pull rune error:', error);
      toast({
        variant: "destructive",
        title: "Failed to pull rune",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };
  
  // Select which content to show based on authentication state
  const renderContent = () => {
    if (isAuthenticated) {
      return (
        <>
          <h2 className="font-cinzel text-3xl mb-2 text-gold">Daily Guidance Awaits</h2>
          <p className="text-lightgray max-w-md mx-auto mb-4">
            Pull your daily rune to receive guidance from the ancient Elder Futhark.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Connected as: User ID {user?.id} 
            {user?.farcasterAddress ? ` | Farcaster: ${user.farcasterAddress.substring(0, 6)}...` : ''}
            {user?.walletAddress ? ` | Wallet: ${user.walletAddress.substring(0, 6)}...` : ''}
          </p>
          
          <Button
            onClick={handlePullRune}
            disabled={pullRuneMutation.isPending || hasPulled === true}
            className="gold-gradient text-black font-cinzel font-bold py-6 px-10 rounded-lg text-lg shadow-lg hover:scale-105 transition duration-300 rune-glow h-auto"
          >
            {pullRuneMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-black rounded-full border-t-transparent animate-spin mr-2"></div>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {hasPulled ? "Already Pulled Today" : "Pull Today's Rune"}
              </>
            )}
          </Button>
          
          {hasPulled && (
            <div className="mt-4">
              <Button
                onClick={() => document.dispatchEvent(new CustomEvent('changeView', { detail: 'daily' }))}
                variant="outline"
                className="flex items-center text-gold border border-gold rounded-lg px-6 py-2 hover:bg-gold/10 transition duration-300"
              >
                <span>View Your Rune</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      );
    }
    
    return (
      <>
        <h2 className="font-cinzel text-3xl mb-2 text-gold">Welcome to Mote Runes</h2>
        <p className="text-lightgray max-w-md mx-auto mb-8">
          Connect with your Farcaster account to receive daily guidance from the Elder Futhark runes.
        </p>
        
        <motion.div 
          className="flex flex-col space-y-4 w-full max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="w-full">
            <Button
              onClick={connectWithFarcaster}
              disabled={isLoading}
              className="bg-darkgray border border-gold text-gold font-medium py-6 rounded-lg hover:bg-gold hover:text-black transition duration-300 h-auto w-full"
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
                  <path d="M12 2.5c-5.247 0-9.5 4.253-9.5 9.5s4.253 9.5 9.5 9.5 9.5-4.253 9.5-9.5-4.253-9.5-9.5-9.5zm0 2c4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5-7.5-3.358-7.5-7.5 3.358-7.5 7.5-7.5z"/>
                  <path d="M8.5 9.5a1 1 0 0 1 1-1H14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4.5a1 1 0 0 1-1-1v-5z" />
                </svg>
              )}
              Connect with Farcaster
            </Button>
          </div>
          
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
          
          <Button
            onClick={loginWithTestUser}
            disabled={isLoading}
            variant="outline"
            className="bg-transparent border border-blue-400 text-blue-400 font-medium py-6 rounded-lg hover:bg-blue-400/10 transition duration-300 h-auto"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current rounded-full border-t-transparent animate-spin mr-2"></div>
            ) : (
              <svg 
                className="mr-2 h-5 w-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            )}
            Test User Login
          </Button>
        </motion.div>
      </>
    );
  };
  
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
        
        {renderContent()}
      </motion.div>
    </div>
  );
}
