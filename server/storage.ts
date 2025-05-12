import { 
  users, type User, type InsertUser,
  runes, type Rune, type InsertRune,
  runePulls, type RunePull, type InsertRunePull, type RunePullWithRune,
  runeCounts, type RuneCount, type InsertRuneCount, type RuneCountWithRune
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFarcasterAddress(address: string): Promise<User | undefined>;
  getUserByWalletAddress(address: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getRune(id: number): Promise<Rune | undefined>;
  getAllRunes(): Promise<Rune[]>;
  createRune(rune: InsertRune): Promise<Rune>;
  
  getRunePull(id: number): Promise<RunePull | undefined>;
  getRunePullsByUser(userId: number): Promise<RunePullWithRune[]>;
  getLatestRunePullByUser(userId: number): Promise<RunePullWithRune | undefined>;
  createRunePull(runePull: InsertRunePull): Promise<RunePull>;
  hasUserPulledToday(userId: number, date: Date): Promise<boolean>;
  
  // New methods for rune counts
  getRuneCountsByUser(userId: number): Promise<RuneCountWithRune[]>;
  incrementRuneCount(userId: number, runeId: number): Promise<RuneCount>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private runes: Map<number, Rune>;
  private runePulls: Map<number, RunePull>;
  private userIdCounter: number;
  private runeIdCounter: number;
  private runePullIdCounter: number;

  constructor() {
    this.users = new Map();
    this.runes = new Map();
    this.runePulls = new Map();
    this.userIdCounter = 1;
    this.runeIdCounter = 1;
    this.runePullIdCounter = 1;
    
    // Initialize with default runes
    this.initializeRunes();
    
    // Create a test user for debugging
    this.createUser({
      username: 'testuser',
      password: 'password'
    }).then(user => {
      console.log("Created test user for debugging:", user);
    });
  }

  private initializeRunes() {
    const elderFutharkRunes = [
      {
        name: "FEHU",
        symbol: "ᚠ",
        meaning: "Wealth, Prosperity",
        interpretation: "Fehu signals a time of abundance and prosperity. Today, pay attention to your resources and consider how you can better manage what you have.",
        guidance: "Focus on gratitude for what you possess and consider how to make your resources work for you. A good day for financial planning.",
        rarity: "uncommon"
      },
      {
        name: "URUZ",
        symbol: "ᚢ",
        meaning: "Strength, Vitality",
        interpretation: "Uruz brings physical energy and determination. This is a good time for new beginnings that require endurance and persistence.",
        guidance: "Trust in your physical strength and emotional resilience. Today is ideal for tackling challenging tasks that require stamina.",
        rarity: "common"
      },
      {
        name: "THURISAZ",
        symbol: "ᚦ",
        meaning: "Protection, Catalyst",
        interpretation: "Thurisaz offers protection but can also indicate challenges that serve as catalysts for growth. Approach obstacles as opportunities.",
        guidance: "Be mindful of reactive behavior. Consider how challenges today may actually be serving your higher purpose.",
        rarity: "rare"
      },
      {
        name: "ANSUZ",
        symbol: "ᚨ",
        meaning: "Communication, Wisdom",
        interpretation: "Ansuz represents divine communication and wisdom. Listen carefully to messages coming your way and trust your intuition.",
        guidance: "Pay attention to recurring thoughts and messages. Your intuition is heightened, and wisdom is available to you if you listen carefully.",
        rarity: "epic"
      },
      {
        name: "RAIDHO",
        symbol: "ᚱ",
        meaning: "Journey, Growth",
        interpretation: "Raidho indicates a journey or progression. Today may bring movement in your life, either literal or metaphorical.",
        guidance: "Consider what journey you're on and if you're moving in the right direction. Good day for travel or making plans for future movement.",
        rarity: "common"
      },
      {
        name: "KENAZ",
        symbol: "ᚲ",
        meaning: "Vision, Creativity",
        interpretation: "Kenaz brings illumination, knowledge, and creative inspiration. A torch in the darkness to guide your way.",
        guidance: "Follow creative impulses and trust in your ability to bring ideas to life. A good day for artistic pursuits and learning.",
        rarity: "uncommon"
      },
      {
        name: "GEBO",
        symbol: "ᚷ", 
        meaning: "Partnership, Gifts",
        interpretation: "Gebo represents gifts, generosity, and balanced exchanges. Consider the give and take in your relationships.",
        guidance: "Be open to receiving today, and look for opportunities to give without expectation. Balance is key in all exchanges.",
        rarity: "common"
      },
      {
        name: "WUNJO",
        symbol: "ᚹ",
        meaning: "Joy, Harmony",
        interpretation: "Wunjo brings joy, pleasure, and fellowship. A time of happiness and harmony in your life.",
        guidance: "Appreciate the simple pleasures today. Share your good feelings with others and allow yourself to fully experience joy.",
        rarity: "uncommon"
      },
      { 
        name: "HAGALAZ", 
        symbol: "ᚺ", 
        meaning: "Disruption, Transformation",
        interpretation: "Hagalaz represents disruptive forces that ultimately lead to transformation. It brings necessary destruction before renewal.",
        guidance: "When disruptions occur today, view them as opportunities for transformation rather than mere obstacles. Something better awaits after the storm.",
        rarity: "rare"
      },
      { 
        name: "NAUTHIZ", 
        symbol: "ᚾ", 
        meaning: "Need, Constraint",
        interpretation: "Nauthiz represents necessity and constraint. It reveals where you must act from need rather than desire, teaching self-reliance.",
        guidance: "Distinguish between wants and true needs today. The restrictions you face are teaching important lessons about self-sufficiency.",
        rarity: "rare"
      },
      { 
        name: "ISA", 
        symbol: "ᛁ", 
        meaning: "Standstill, Clarity",
        interpretation: "Isa brings a stillness that allows for concentration and clarity. A time to pause, reflect, and gain perspective.",
        guidance: "Embrace stillness today. Take time to pause, gather your thoughts, and gain clarity before moving forward. Rushing will not serve you.",
        rarity: "rare"
      },
      { 
        name: "JERA", 
        symbol: "ᛃ", 
        meaning: "Harvest, Cycle",
        interpretation: "Jera represents the harvest that comes after patient work. It reminds us that all things have their season and proper timing.",
        guidance: "Recognize that good outcomes require proper timing. Be patient with processes that cannot be rushed, knowing your efforts will bear fruit in due season.",
        rarity: "epic"
      },
      { 
        name: "EIHWAZ", 
        symbol: "ᛇ", 
        meaning: "Endurance, Defense",
        interpretation: "Eihwaz represents strength through adversity and the ability to endure. It provides protection and connects different realms of existence.",
        guidance: "Draw on your inner reserves of strength today. You have greater endurance than you realize, and this is a time to stand firm against challenges.",
        rarity: "epic"
      },
      { 
        name: "PERTHRO", 
        symbol: "ᛈ", 
        meaning: "Mystery, Fate",
        interpretation: "Perthro represents the mysteries of fate and the unknown aspects of existence. It brings initiation into hidden knowledge.",
        guidance: "Be open to the mysterious today. Not everything can or should be explained, and accepting uncertainty creates space for magical possibilities.",
        rarity: "legendary"
      },
      { 
        name: "ALGIZ", 
        symbol: "ᛉ", 
        meaning: "Protection, Higher Self",
        interpretation: "Algiz offers divine protection and connection to higher consciousness. It represents the elk, with antlers reaching to the heavens while firmly grounded.",
        guidance: "You are divinely protected today. Connect with your higher self and spiritual guides while remaining grounded in practical matters.",
        rarity: "legendary"
      },
      { 
        name: "SOWILO", 
        symbol: "ᛊ", 
        meaning: "Success, Wholeness",
        interpretation: "Sowilo represents the illuminating power of the sun, bringing success, wholeness, and vitality. It guarantees ultimate victory.",
        guidance: "Let your inner light shine today. Success is available to you when you align with your true purpose and wholeness. Victory is assured.",
        rarity: "legendary"
      },
    ];

    elderFutharkRunes.forEach(runeData => {
      this.createRune(runeData);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    console.log('Getting user with ID:', id);
    console.log('Current users in storage:', Array.from(this.users.entries()));
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByFarcasterAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.farcasterAddress === address
    );
  }

  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === address
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    console.log('Creating user with ID:', id, 'Data:', insertUser);
    
    const user: User = { 
      ...insertUser,
      id,
      // Handle new Farcaster fields
      password: insertUser.password || null,
      farcasterAddress: insertUser.farcasterAddress || null,
      walletAddress: insertUser.walletAddress || null,
      fid: insertUser.fid || null,
      displayName: insertUser.displayName || null,
      pfpUrl: insertUser.pfpUrl || null,
      custody: insertUser.custody || null,
      verifications: insertUser.verifications || []
    };
    
    this.users.set(id, user);
    console.log('User created and stored. Current users:', Array.from(this.users.entries()));
    return user;
  }

  async getRune(id: number): Promise<Rune | undefined> {
    return this.runes.get(id);
  }

  async getAllRunes(): Promise<Rune[]> {
    return Array.from(this.runes.values());
  }

  async createRune(insertRune: InsertRune): Promise<Rune> {
    const id = this.runeIdCounter++;
    const rune: Rune = { 
      ...insertRune, 
      id,
      rarity: insertRune.rarity || "common" // Default to common if no rarity provided
    };
    this.runes.set(id, rune);
    return rune;
  }

  async getRunePull(id: number): Promise<RunePull | undefined> {
    return this.runePulls.get(id);
  }

  async getRunePullsByUser(userId: number): Promise<RunePullWithRune[]> {
    const userPulls = Array.from(this.runePulls.values()).filter(
      (pull) => pull.userId === userId
    );
    
    // Sort by date (newest first)
    userPulls.sort((a, b) => {
      return new Date(b.pullDate).getTime() - new Date(a.pullDate).getTime();
    });
    
    // Attach rune data to each pull
    return Promise.all(
      userPulls.map(async (pull) => {
        const rune = await this.getRune(pull.runeId);
        if (!rune) {
          throw new Error(`Rune with ID ${pull.runeId} not found`);
        }
        return { ...pull, rune };
      })
    );
  }

  async getLatestRunePullByUser(userId: number): Promise<RunePullWithRune | undefined> {
    const userPulls = await this.getRunePullsByUser(userId);
    if (userPulls.length === 0) {
      return undefined;
    }
    return userPulls[0]; // Already sorted by date
  }

  async createRunePull(insertRunePull: InsertRunePull): Promise<RunePull> {
    const id = this.runePullIdCounter++;
    const runePull: RunePull = { ...insertRunePull, id, createdAt: new Date() };
    this.runePulls.set(id, runePull);
    return runePull;
  }

  async hasUserPulledToday(userId: number, date: Date): Promise<boolean> {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    const todayStr = today.toISOString().split('T')[0];
    
    return Array.from(this.runePulls.values()).some(
      (pull) => 
        pull.userId === userId && 
        new Date(pull.pullDate).toISOString().split('T')[0] === todayStr
    );
  }
  
  // These are stub implementations since we don't have rune counts in memory storage
  async getRuneCountsByUser(userId: number): Promise<RuneCountWithRune[]> {
    // We'll calculate this on the fly from runePulls
    const userPulls = await this.getRunePullsByUser(userId);
    
    // Count occurrences of each rune
    const countMap = new Map<number, { count: number, rune: Rune, firstPulledAt: Date, lastPulledAt: Date }>();
    
    for (const pull of userPulls) {
      if (!countMap.has(pull.runeId)) {
        countMap.set(pull.runeId, { 
          count: 1, 
          rune: pull.rune,
          firstPulledAt: new Date(pull.createdAt),
          lastPulledAt: new Date(pull.createdAt)
        });
      } else {
        const current = countMap.get(pull.runeId)!;
        current.count += 1;
        
        const pullDate = new Date(pull.createdAt);
        if (pullDate < current.firstPulledAt) {
          current.firstPulledAt = pullDate;
        }
        if (pullDate > current.lastPulledAt) {
          current.lastPulledAt = pullDate;
        }
      }
    }
    
    // Convert to array and sort by count (descending)
    return Array.from(countMap.entries())
      .map(([runeId, data]) => ({
        userId,
        runeId,
        count: data.count,
        firstPulledAt: data.firstPulledAt,
        lastPulledAt: data.lastPulledAt,
        rune: data.rune
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  async incrementRuneCount(userId: number, runeId: number): Promise<RuneCount> {
    // In memory storage, we don't actually track this separately
    // We just return a mock object here
    return {
      userId,
      runeId,
      count: 1,
      firstPulledAt: new Date(),
      lastPulledAt: new Date()
    };
  }
}

// Import our DatabaseStorage implementation
import { DatabaseStorage } from './database-storage';

// Use the database implementation
export const storage = new DatabaseStorage();

// Initialize the database
(async () => {
  try {
    // Initialize default runes
    await storage.initializeDefaultRunes();
    
    // Create test user
    await storage.createTestUser();
    
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
})();