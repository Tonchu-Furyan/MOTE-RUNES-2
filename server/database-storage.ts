import { 
  users, type User, type InsertUser,
  runes, type Rune, type InsertRune,
  runePulls, type RunePull, type InsertRunePull, type RunePullWithRune,
  runeCounts, type RuneCount, type InsertRuneCount, type RuneCountWithRune
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, desc, sql } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  
  // ----- User methods -----
  
  async getUser(id: number): Promise<User | undefined> {
    console.log('Getting user with ID:', id);
    const result = await db.select().from(users).where(eq(users.id, id));
    console.log('Looking up user with ID:', id, 'Result:', result.length ? 'Found' : 'Not found');
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByFarcasterAddress(address: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.farcasterAddress, address));
    return result[0];
  }

  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.walletAddress, address));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log('Creating user with data:', insertUser);
    const result = await db.insert(users).values(insertUser).returning();
    console.log('User created:', result[0]);
    return result[0];
  }

  // ----- Rune methods -----
  
  async getRune(id: number): Promise<Rune | undefined> {
    console.log('Looking up rune with ID:', id);
    const result = await db.select().from(runes).where(eq(runes.id, id));
    console.log('Looking up rune with ID:', id, 'Result:', result.length ? 'Found' : 'Not found');
    return result[0];
  }

  async getAllRunes(): Promise<Rune[]> {
    return db.select().from(runes);
  }

  async createRune(insertRune: InsertRune): Promise<Rune> {
    const result = await db.insert(runes).values(insertRune).returning();
    return result[0];
  }

  // ----- RunePull methods -----
  
  async getRunePull(id: number): Promise<RunePull | undefined> {
    const result = await db.select().from(runePulls).where(eq(runePulls.id, id));
    return result[0];
  }

  async getRunePullsByUser(userId: number): Promise<RunePullWithRune[]> {
    // Join runePulls with runes to get the rune details for each pull
    const result = await db.select({
      id: runePulls.id,
      userId: runePulls.userId,
      runeId: runePulls.runeId,
      pullDate: runePulls.pullDate,
      createdAt: runePulls.createdAt,
      rune: runes
    })
    .from(runePulls)
    .innerJoin(runes, eq(runePulls.runeId, runes.id))
    .where(eq(runePulls.userId, userId))
    .orderBy(desc(runePulls.createdAt));
    
    return result;
  }

  async getLatestRunePullByUser(userId: number): Promise<RunePullWithRune | undefined> {
    const result = await db.select({
      id: runePulls.id,
      userId: runePulls.userId,
      runeId: runePulls.runeId,
      pullDate: runePulls.pullDate,
      createdAt: runePulls.createdAt,
      rune: runes
    })
    .from(runePulls)
    .innerJoin(runes, eq(runePulls.runeId, runes.id))
    .where(eq(runePulls.userId, userId))
    .orderBy(desc(runePulls.createdAt))
    .limit(1);
    
    return result[0];
  }

  async createRunePull(insertRunePull: InsertRunePull): Promise<RunePull> {
    const result = await db.insert(runePulls).values(insertRunePull).returning();
    
    // Also increment the rune count for this user and rune
    await this.incrementRuneCount(insertRunePull.userId, insertRunePull.runeId);
    
    return result[0];
  }

  async hasUserPulledToday(userId: number, date: Date): Promise<boolean> {
    console.log(`User ${userId} has pulled today?`);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    // Using a formatted date string comparison for better compatibility
    const dateStr = startOfDay.toISOString().split('T')[0];
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(runePulls)
      .where(
        and(
          eq(runePulls.userId, userId),
          sql`date(${runePulls.pullDate}) = ${dateStr}`
        )
      );
    
    const hasPulled = result[0].count > 0;
    console.log(`User ${userId} has pulled today?`, hasPulled);
    return hasPulled;
  }
  
  // ----- RuneCount methods -----
  
  async getRuneCountsByUser(userId: number): Promise<RuneCountWithRune[]> {
    const result = await db.select({
      userId: runeCounts.userId,
      runeId: runeCounts.runeId,
      count: runeCounts.count,
      firstPulledAt: runeCounts.firstPulledAt,
      lastPulledAt: runeCounts.lastPulledAt,
      rune: runes
    })
    .from(runeCounts)
    .innerJoin(runes, eq(runeCounts.runeId, runes.id))
    .where(eq(runeCounts.userId, userId))
    .orderBy(desc(runeCounts.count));
    
    return result;
  }
  
  async incrementRuneCount(userId: number, runeId: number): Promise<RuneCount> {
    // First check if a count record already exists
    const existingCount = await db.select()
      .from(runeCounts)
      .where(
        and(
          eq(runeCounts.userId, userId),
          eq(runeCounts.runeId, runeId)
        )
      );
    
    const now = new Date();
    
    if (existingCount.length > 0) {
      // Update existing record
      const result = await db.update(runeCounts)
        .set({ 
          count: existingCount[0].count + 1,
          lastPulledAt: now
        })
        .where(
          and(
            eq(runeCounts.userId, userId),
            eq(runeCounts.runeId, runeId)
          )
        )
        .returning();
      
      return result[0];
    } else {
      // Create new record
      const result = await db.insert(runeCounts)
        .values({
          userId,
          runeId,
          count: 1,
          firstPulledAt: now,
          lastPulledAt: now
        })
        .returning();
      
      return result[0];
    }
  }
  
  // ----- Initialize database -----
  
  async initializeDefaultRunes(): Promise<void> {
    // Check if runes already exist
    const existingRunes = await db.select().from(runes);
    if (existingRunes.length > 0) {
      console.log("Runes already exist in the database, skipping initialization.");
      return;
    }
    
    console.log("Initializing default runes...");
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
    
    // Insert all runes at once
    await db.insert(runes).values(elderFutharkRunes);
    console.log("Default runes initialized successfully.");
  }
  
  async createTestUser(): Promise<User> {
    // Check if test user already exists
    const existingUser = await this.getUserByUsername('testuser');
    if (existingUser) {
      console.log("Test user already exists.");
      return existingUser;
    }
    
    console.log("Creating test user for debugging...");
    const user = await this.createUser({
      username: 'testuser',
      password: 'password'
    });
    
    console.log("Created test user for debugging:", user);
    return user;
  }
}