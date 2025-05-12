import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRunePullSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { Message as FarcasterMessage } from "@farcaster/core";

export async function registerRoutes(app: Express): Promise<Server> {
  // AUTH ROUTES
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsedBody = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(parsedBody.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(parsedBody);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Don't return the password
      const { password: userPassword, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user/farcaster/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const user = await storage.getUserByFarcasterAddress(address);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user/wallet/:address", async (req: Request, res: Response) => {
    try {
      const { address } = req.params;
      const user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Farcaster SIWF (Sign-In With Farcaster) authentication
  app.post("/api/auth/farcaster", async (req: Request, res: Response) => {
    try {
      const { message, signature, fid, username, displayName, pfpUrl, bio, custody } = req.body;
      
      if (!message || !signature || !fid) {
        return res.status(400).json({ 
          message: "Missing required Farcaster authentication data" 
        });
      }
      
      // Parse and verify the Farcaster message
      try {
        // In development, we might pass in mock data
        if (process.env.NODE_ENV === 'development' && message === 'mock_message') {
          console.log("Using mock Farcaster authentication for development");
        } else {
          // In production, we need to properly verify the Farcaster message
          try {
            // Import the FarcasterMessage type from @farcaster/core
            const { FarcasterMessage, ViemLocalEip712Signer } = await import('@farcaster/core');
            
            // Parse the message
            const parsedMessage = FarcasterMessage.fromJSON(JSON.parse(message));
            
            // Convert signature to buffer if it's a string
            const signatureBuffer = typeof signature === 'string' 
              ? Buffer.from(signature.replace(/^0x/, ''), 'hex') 
              : signature;
            
            // Verify the signature (implementation depends on Farcaster SDK version)
            // This is a placeholder - replace with actual verification logic
            // from the Farcaster documentation for your SDK version
            const isValid = !!parsedMessage && !!signatureBuffer;
            
            if (!isValid) {
              console.error("Invalid Farcaster signature");
              return res.status(401).json({ message: "Invalid Farcaster signature" });
            }
          } catch (verifyError) {
            console.error("Error verifying Farcaster message:", verifyError);
            return res.status(401).json({ message: "Farcaster verification failed" });
          }
        }
      } catch (error) {
        console.error("Error processing Farcaster authentication:", error);
        return res.status(400).json({ message: "Invalid Farcaster message format" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByFarcasterAddress(custody);
      
      if (!user) {
        // Create a new user
        user = await storage.createUser({
          username: username || `farcaster_${fid}`,
          farcasterAddress: custody,
          fid: Number(fid),
          displayName: displayName || username,
          pfpUrl,
          custody,
          verifications: []
        });
        
        console.log("Created new Farcaster user:", user);
      } else {
        console.log("Found existing Farcaster user:", user);
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error in Farcaster authentication:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // RUNE ROUTES
  app.get("/api/runes", async (_req: Request, res: Response) => {
    try {
      const runes = await storage.getAllRunes();
      return res.status(200).json(runes);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/runes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rune = await storage.getRune(parseInt(id));
      
      if (!rune) {
        return res.status(404).json({ message: "Rune not found" });
      }
      
      return res.status(200).json(rune);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // RUNE PULL ROUTES
  app.post("/api/rune-pulls", async (req: Request, res: Response) => {
    try {
      const { userId, runeId } = req.body;
      
      console.log('POST /api/rune-pulls request body:', req.body);
      
      if (!userId || !runeId) {
        console.log('Missing required fields userId or runeId');
        return res.status(400).json({ message: "User ID and Rune ID are required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      console.log('Looking up user with ID:', userId, 'Result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if rune exists
      const rune = await storage.getRune(runeId);
      console.log('Looking up rune with ID:', runeId, 'Result:', rune ? 'Found' : 'Not found');
      
      if (!rune) {
        return res.status(404).json({ message: "Rune not found" });
      }
      
      // Check if user has already pulled a rune today
      const today = new Date();
      const hasPulledToday = await storage.hasUserPulledToday(userId, today);
      console.log('User', userId, 'has pulled today?', hasPulledToday);
      
      if (hasPulledToday) {
        return res.status(400).json({ message: "You have already pulled a rune today" });
      }
      
      // Create new rune pull
      const newRunePull = await storage.createRunePull({
        userId,
        runeId,
        pullDate: today.toISOString()
      });
      
      console.log('Created new rune pull:', newRunePull);
      
      // Return the pull with the rune data
      const pullWithRune = {
        ...newRunePull,
        rune
      };
      
      return res.status(201).json(pullWithRune);
    } catch (error) {
      console.error('Error in POST /api/rune-pulls:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rune-pulls/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const pulls = await storage.getRunePullsByUser(parseInt(userId));
      
      return res.status(200).json(pulls);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rune-pulls/user/:userId/latest", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const latestPull = await storage.getLatestRunePullByUser(parseInt(userId));
      
      if (!latestPull) {
        return res.status(404).json({ message: "No rune pulls found for this user" });
      }
      
      return res.status(200).json(latestPull);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rune-pulls/user/:userId/check-today", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const today = new Date();
      const hasPulledToday = await storage.hasUserPulledToday(parseInt(userId), today);
      
      return res.status(200).json({ hasPulledToday });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint to get rune counts for a user
  app.get("/api/rune-counts/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const runeCounts = await storage.getRuneCountsByUser(parseInt(userId));
      
      return res.status(200).json(runeCounts);
    } catch (error) {
      console.error('Error fetching rune counts:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
