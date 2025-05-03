import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  farcasterAddress: text("farcaster_address"),
  walletAddress: text("wallet_address"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  farcasterAddress: true,
  walletAddress: true,
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
});

export const insertRuneSchema = createInsertSchema(runes).pick({
  name: true,
  symbol: true,
  meaning: true,
  interpretation: true,
  guidance: true,
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
