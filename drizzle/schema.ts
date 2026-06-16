import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Core Auth User ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Funnel Leads ─────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  source: varchar("source", { length: 255 }).default("organic"),
  qualified: boolean("qualified").default(false).notNull(),
  booked: boolean("booked").default(false).notNull(),
  // VSL engagement tracking
  vslPlayed: boolean("vslPlayed").default(false).notNull(),
  vslPercentWatched: int("vslPercentWatched").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Calendly Bookings ────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").references(() => leads.id),
  calendlyEventUri: varchar("calendlyEventUri", { length: 512 }),
  calendlyInviteeUri: varchar("calendlyInviteeUri", { length: 512 }),
  inviteeEmail: varchar("inviteeEmail", { length: 320 }).notNull(),
  inviteeName: varchar("inviteeName", { length: 255 }),
  scheduledTime: timestamp("scheduledTime"),
  status: mysqlEnum("status", ["active", "canceled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ─── Funnel Configuration ─────────────────────────────────────────────────────
export const funnelConfig = mysqlTable("funnel_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunnelConfig = typeof funnelConfig.$inferSelect;
export type InsertFunnelConfig = typeof funnelConfig.$inferInsert;
