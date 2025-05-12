import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSignIn } from '@farcaster/auth-kit';

interface User {
  id: number;
  username: string;
  farcasterAddress?: string;
  walletAddress?: string;
  fid?: number;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// For production deployment, we'll use the real Coinbase Minikit and Farcaster Auth Kit
// Import the necessary functionality from @coinbase/onchainkit if needed
// import { connectWallet } from '@coinbase/onchainkit';

// For development and testing purposes, we have these functions
// In production, these should be replaced with actual implementations
const mockFarcasterConnect = async (): Promise<{ address: string; username: string }> => {
  // Simulate async connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Use a fixed address for our test user so we don't create a new user every time
  return {
    address: '0xfixed123456',
    username: 'testuser'
  };
};

const mockWalletConnect = async (): Promise<{ address: string }> => {
  // Simulate async connection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Use a fixed address for our test user so we don't create a new user every time
  return { address: '0xfixed123456' };
};

export default function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  
  const { toast } = useToast();
  
  // Helper function to login with test user
  const loginWithTestUser = async () => {
    try {
      console.log('Attempting to login with test user');
      
      // Login with the test user
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password'
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to login with test user, status:', response.status);
        return null;
      }
      
      const user = await response.json();
      console.log('Successfully logged in with test user:', user);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth state with the user data
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // Dispatch authentication event to ensure components update
      document.dispatchEvent(new CustomEvent('userAuthenticated', { 
        detail: { user } 
      }));
      
      // Force a reload to ensure clean state
      window.location.reload();
      
      toast({
        title: "Connected Successfully",
        description: "You're now signed in with test user",
      });
      
      return user;
    } catch (error) {
      console.error('Error logging in with test user:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check for existing session in localStorage or cookie
    const checkAuth = async () => {
      try {
        console.log("Auth hook initializing, checking localStorage");
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            console.log("Found user in localStorage:", user);
            
            // Set state with a small delay to ensure it propagates properly
            setTimeout(() => {
              setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
              
              // Dispatch event to notify components that user is authenticated
              document.dispatchEvent(new CustomEvent('userAuthenticated', { 
                detail: { user } 
              }));
            }, 10);
          } catch (e) {
            console.error("Failed to parse stored user", e);
            localStorage.removeItem('user');
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Authentication check failed',
            });
          }
        } else {
          console.log("No user found in localStorage");
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication check failed',
        });
      }
    };

    checkAuth();
  }, []);

  // Initialize Farcaster auth hook with required parameters
  const { 
    signIn, 
    error: farcasterError, 
    isSuccess: isFarcasterSuccess,
    isError: isFarcasterError
  } = useSignIn({
    timeout: 300000, // 5 minutes timeout for the sign in process
    interval: 1000,  // Polling interval in milliseconds
    onSuccess: (data) => {
      console.log("Farcaster sign-in succeeded:", data);
      // In a production environment, this callback would handle saving the authentication data
      // and completing the sign-in process
    },
    onError: (error) => {
      console.error("Farcaster sign-in error:", error);
    }
  });
  
  const connectWithFarcaster = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a dev environment, the Farcaster authentication doesn't work properly
      // so we'll simulate it with mock data for testing purposes
      
      // Define our user data structure
      type FarcasterUserData = {
        message: string;
        signature: string;
        fid: number;
        username: string;
        displayName: string;
        pfpUrl: string | null;
        bio: string | null;
        custody: string;
      };
      
      // This will store our user data
      let userData: FarcasterUserData;
      
      // Production vs Development environment handling
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('replit');
      
      if (isDevelopment) {
        // We're in a development environment, use mock data for testing
        console.log("Using mock Farcaster data for development");
        userData = {
          message: "mock_message",
          signature: "mock_signature",
          fid: 12345,
          username: "testuser",
          displayName: "Test Farcaster User",
          pfpUrl: null,
          bio: null,
          custody: "0xfixed123456"
        };
      } else {
        // In production, use the real Farcaster Auth Kit
        try {
          console.log("Initiating Farcaster sign-in flow...");
          
          // This will trigger the Farcaster auth flow but doesn't return user data directly
          // The onSuccess callback in useSignIn will be called with the result
          signIn();
          
          // For now, we'll create a placeholder for the real authentication flow
          // In a real deployment, you would set up proper callback handling
          // through the onSuccess parameter when initializing useSignIn
          throw new Error('Farcaster auth requires deployment with proper domain configuration');
        } catch (e) {
          console.error("Farcaster authentication error:", e);
          // In production, this would be an actual error
          // For now, to allow testing, we'll use mock data
          if (isDevelopment) {
            userData = {
              message: "mock_message", 
              signature: "mock_signature",
              fid: 12345,
              username: "testuser", 
              displayName: "Test Farcaster User",
              pfpUrl: null,
              bio: null,
              custody: "0xfixed123456"
            };
          } else {
            throw new Error('Farcaster authentication failed. Please try again.');
          }
        }
      }
      
      console.log("Farcaster sign-in success:", userData);
      
      // Extract Farcaster user data
      const { 
        message, 
        signature, 
        fid, 
        username, 
        displayName, 
        pfpUrl, 
        bio, 
        custody 
      } = userData;
      
      // Authenticate with our backend
      const authResponse = await fetch('/api/auth/farcaster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          signature,
          fid,
          username,
          displayName,
          pfpUrl,
          bio,
          custody
        }),
      });
      
      if (!authResponse.ok) {
        throw new Error('Failed to authenticate with server');
      }
      
      // Get user data from response
      const user = await authResponse.json();
      console.log("User authenticated with server:", user);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // Dispatch authentication event
      document.dispatchEvent(new CustomEvent('userAuthenticated', { 
        detail: { user } 
      }));
      
      toast({
        title: "Connected Successfully",
        description: `You're now signed in as ${displayName || username || 'a Farcaster user'}`,
      });
      
      return user;
    } catch (error) {
      console.error('Error connecting with Farcaster:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Authentication failed',
      });
      
      return null;
    }
  };

  const connectWithWallet = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // This would use the actual Coinbase Minikit in production
      const { address } = await mockWalletConnect();
      
      // Check if user exists
      const response = await fetch(`/api/auth/user/wallet/${address}`);
      
      let user: User;
      
      if (response.status === 404) {
        // Create new user
        const createResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: `wallet_${Math.floor(Math.random() * 10000)}`,
            password: Math.random().toString(36).substring(2), // Random password
            walletAddress: address,
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create user');
        }
        
        user = await createResponse.json();
      } else if (response.ok) {
        user = await response.json();
      } else {
        throw new Error('Failed to authenticate');
      }
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      toast({
        title: "Connected Successfully",
        description: "You're now signed in with your wallet",
      });
      
      return user;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Authentication failed',
      });
      
      return null;
    }
  };

  const logout = () => {
    console.log('Executing logout function');
    
    // Dispatch the event first, so listeners can respond
    document.dispatchEvent(new CustomEvent('userLogout'));
    
    // Clear ALL user data from local storage
    localStorage.clear();
    
    // Update auth state to reflect logged out status
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    
    // For debugging purposes, log the logout event
    console.log('User logged out successfully, auth state reset');
    
    // Force a reload after a short delay to ensure clean state
    setTimeout(() => window.location.href = '/', 300);
  };

  return {
    ...authState,
    connectWithFarcaster,
    connectWithWallet, 
    loginWithTestUser, // Add the new function
    logout,
  };
}
