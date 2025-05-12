import { pgTable, text, serial, integer, timestamp, date, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Make password optional for Farcaster users
  farcasterAddress: text("farcaster_address"),
  walletAddress: text("wallet_address"),
  fid: integer("farcaster_id"),  // Farcaster user ID
  displayName: text("display_name"),  // User's display name from Farcaster
  pfpUrl: text("profile_image_url"),  // Profile picture URL
  custody: text("custody_address"),  // Custody address for Farcaster
  verifications: text("verifications").array(),  // Array of verified addresses
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  farcasterAddress: true,
  walletAddress: true,
  fid: true,
  displayName: true,
  pfpUrl: true,
  custody: true,
  verifications: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const runes = pgTable("runes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  meaning: text("meaning").notNull(),
  interpretation: text("interpretation").notNull(),
  guidance: text("guidance").notNull(),
  rarity: text("rarity").notNull().default("common"),
});

export const insertRuneSchema = createInsertSchema(runes).pick({
  name: true,
  symbol: true,
  meaning: true,
  interpretation: true,
  guidance: true,
  rarity: true,
});

export type InsertRune = z.infer<typeof insertRuneSchema>;
export type Rune = typeof runes.$inferSelect;

export const runePulls = pgTable("rune_pulls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  runeId: integer("rune_id").notNull(),
  pullDate: date("pull_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRunePullSchema = createInsertSchema(runePulls).pick({
  userId: true,
  runeId: true,
  pullDate: true,
});

export type InsertRunePull = z.infer<typeof insertRunePullSchema>;
export type RunePull = typeof runePulls.$inferSelect;

export type RunePullWithRune = RunePull & {
  rune: Rune;
};

// Relation definitions for our tables
export const usersRelations = relations(users, ({ many }) => ({
  runePulls: many(runePulls),
  runeCounts: many(runeCounts),
}));

export const runesRelations = relations(runes, ({ many }) => ({
  runePulls: many(runePulls),
  runeCounts: many(runeCounts),
}));

export const runePullsRelations = relations(runePulls, ({ one }) => ({
  user: one(users, {
    fields: [runePulls.userId],
    references: [users.id],
  }),
  rune: one(runes, {
    fields: [runePulls.runeId],
    references: [runes.id],
  }),
}));

// New table for tracking rune counts per user
export const runeCounts = pgTable("rune_counts", {
  userId: integer("user_id").notNull().references(() => users.id),
  runeId: integer("rune_id").notNull().references(() => runes.id),
  count: integer("count").notNull().default(0),
  firstPulledAt: timestamp("first_pulled_at").notNull().defaultNow(),
  lastPulledAt: timestamp("last_pulled_at").notNull().defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.runeId] }),
  }
});

export const runeCountsRelations = relations(runeCounts, ({ one }) => ({
  user: one(users, {
    fields: [runeCounts.userId],
    references: [users.id],
  }),
  rune: one(runes, {
    fields: [runeCounts.runeId],
    references: [runes.id],
  }),
}));

export const insertRuneCountSchema = createInsertSchema(runeCounts).pick({
  userId: true,
  runeId: true,
  count: true,
  firstPulledAt: true,
  lastPulledAt: true,
});

export type InsertRuneCount = z.infer<typeof insertRuneCountSchema>;
export type RuneCount = typeof runeCounts.$inferSelect;

export type RuneCountWithRune = RuneCount & {
  rune: Rune;
};
