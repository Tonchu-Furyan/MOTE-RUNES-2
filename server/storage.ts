import { 
  users, type User, type InsertUser,
  runes, type Rune, type InsertRune,
  runePulls, type RunePull, type InsertRunePull, type RunePullWithRune
} from "@shared/schema";

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
    
    // Initialize with Elder Futhark runes
    this.initializeRunes();
  }

  private initializeRunes() {
    const elderFutharkRunes = [
      {
        name: "FEHU",
        symbol: "ᚠ",
        meaning: "Wealth, Prosperity",
        interpretation: "Fehu signals a time of abundance and prosperity. Today, pay attention to your resources and consider how you can better manage what you have.",
        guidance: "Focus on gratitude for what you possess and consider how to make your resources work for you. A good day for financial planning."
      },
      {
        name: "URUZ",
        symbol: "ᚢ",
        meaning: "Strength, Vitality",
        interpretation: "Uruz brings physical energy and determination. This is a good time for new beginnings that require endurance and persistence.",
        guidance: "Trust in your physical strength and emotional resilience. Today is ideal for tackling challenging tasks that require stamina."
      },
      {
        name: "THURISAZ",
        symbol: "ᚦ",
        meaning: "Protection, Catalyst",
        interpretation: "Thurisaz offers protection but can also indicate challenges that serve as catalysts for growth. Approach obstacles as opportunities.",
        guidance: "Be mindful of reactive behavior. Consider how challenges today may actually be serving your higher purpose."
      },
      {
        name: "ANSUZ",
        symbol: "ᚨ",
        meaning: "Communication, Wisdom",
        interpretation: "Ansuz represents divine communication and wisdom. Listen carefully to messages coming your way and trust your intuition.",
        guidance: "Pay attention to recurring thoughts and messages. Your intuition is heightened, and wisdom is available to you if you listen carefully."
      },
      {
        name: "RAIDHO",
        symbol: "ᚱ",
        meaning: "Journey, Growth",
        interpretation: "Raidho indicates a journey or progression. Today may bring movement in your life, either literal or metaphorical.",
        guidance: "Consider what journey you're on and if you're moving in the right direction. Good day for travel or making plans for future movement."
      },
      {
        name: "KENAZ",
        symbol: "ᚲ",
        meaning: "Vision, Creativity",
        interpretation: "Kenaz brings illumination, knowledge, and creative inspiration. A torch in the darkness to guide your way.",
        guidance: "Follow creative impulses and trust in your ability to bring ideas to life. A good day for artistic pursuits and learning."
      },
      {
        name: "GEBO",
        symbol: "ᚷ", 
        meaning: "Partnership, Gifts",
        interpretation: "Gebo represents gifts, generosity, and balanced exchanges. Consider the give and take in your relationships.",
        guidance: "Be open to receiving today, and look for opportunities to give without expectation. Balance is key in all exchanges."
      },
      {
        name: "WUNJO",
        symbol: "ᚹ",
        meaning: "Joy, Harmony",
        interpretation: "Wunjo brings joy, pleasure, and fellowship. A time of happiness and harmony in your life.",
        guidance: "Appreciate the simple pleasures today. Share your good feelings with others and allow yourself to fully experience joy."
      }
    ];
    
    // Adding rarity values based on the perceived power and meaning of each rune
    const runesWithRarity = [
      { ...elderFutharkRunes[0], rarity: "uncommon" }, // FEHU - Wealth is moderately powerful
      { ...elderFutharkRunes[1], rarity: "common" },   // URUZ - Basic strength rune
      { ...elderFutharkRunes[2], rarity: "rare" },     // THURISAZ - Protection is valuable
      { ...elderFutharkRunes[3], rarity: "epic" },     // ANSUZ - Divine wisdom is very powerful
      { ...elderFutharkRunes[4], rarity: "common" },   // RAIDHO - Basic journey rune
      { ...elderFutharkRunes[5], rarity: "uncommon" }, // KENAZ - Vision is moderately valuable
      { ...elderFutharkRunes[6], rarity: "common" },   // GEBO - Basic partnership rune
      { ...elderFutharkRunes[7], rarity: "uncommon" }  // WUNJO - Joy is moderately valuable
    ];
    
    runesWithRarity.forEach(runeData => {
      this.createRune({
        name: runeData.name,
        symbol: runeData.symbol,
        meaning: runeData.meaning,
        interpretation: runeData.interpretation,
        guidance: runeData.guidance,
        rarity: runeData.rarity
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
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
    const user: User = { 
      ...insertUser,
      id,
      farcasterAddress: insertUser.farcasterAddress || null,
      walletAddress: insertUser.walletAddress || null
    };
    this.users.set(id, user);
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
}

export const storage = new MemStorage();
