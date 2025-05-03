import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRunePullSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

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
  
  // Update user profile with wallet or farcaster address
  app.patch("/api/auth/user/:id/wallet", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(parseInt(id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if wallet address is already linked to another user
      const existingUserWithWallet = await storage.getUserByWalletAddress(walletAddress);
      if (existingUserWithWallet && existingUserWithWallet.id !== parseInt(id)) {
        return res.status(409).json({ message: "Wallet address is already linked to another user" });
      }
      
      // Update user
      const updatedUser = await storage.updateUserWallet(parseInt(id), walletAddress);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user wallet:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/auth/user/:id/farcaster", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { farcasterAddress } = req.body;
      
      if (!farcasterAddress) {
        return res.status(400).json({ message: "Farcaster address is required" });
      }
      
      // Check if user exists
      const user = await storage.getUser(parseInt(id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if farcaster address is already linked to another user
      const existingUserWithFarcaster = await storage.getUserByFarcasterAddress(farcasterAddress);
      if (existingUserWithFarcaster && existingUserWithFarcaster.id !== parseInt(id)) {
        return res.status(409).json({ message: "Farcaster address is already linked to another user" });
      }
      
      // Update user
      const updatedUser = await storage.updateUserFarcaster(parseInt(id), farcasterAddress);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user farcaster:', error);
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

  const httpServer = createServer(app);

  return httpServer;
}
