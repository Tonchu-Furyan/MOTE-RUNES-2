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

// This is a placeholder for the actual Coinbase Minikit implementation
// In a real app, you would import and use the actual Minikit functionality
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

  // Initialize Farcaster auth hook
  const { signIn, error: farcasterError } = useSignIn();
  
  const connectWithFarcaster = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a dev environment, the Farcaster authentication doesn't work properly
      // so we'll simulate it with mock data for testing purposes
      // In a production environment, this would use the actual Farcaster Auth Kit
      let signInResult;
      
      if (window.location.hostname.includes('replit.dev')) {
        // We're in a development environment, use mock data
        console.log("Using mock Farcaster data for development");
        signInResult = {
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
        // Attempt real Farcaster sign in
        try {
          // Note: In the actual environment with proper API keys,
          // this would trigger the Farcaster authentication flow
          signIn();
          
          // This would capture the result in a real environment
          // For now, we'll throw an error to indicate it's not fully implemented
          throw new Error('Farcaster auth requires proper API keys and configuration');
        } catch (e) {
          throw new Error('Farcaster authentication requires API keys and proper configuration');
        }
      }
      
      console.log("Farcaster sign-in success:", signInResult);
      
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
      } = signInResult;
      
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
