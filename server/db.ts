import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { bookings, funnelConfig, InsertBooking, InsertLead, leads, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function createLead(data: { email: string; name?: string; source?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Upsert by email: if lead already exists, update name/source and return existing
  const existing = await db.select().from(leads).where(eq(leads.email, data.email)).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(leads).values({
    email: data.email,
    name: data.name ?? null,
    source: data.source ?? "organic",
  });

  const created = await db.select().from(leads).where(eq(leads.email, data.email)).limit(1);
  return created[0];
}

export async function getLeadByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateLeadQualified(email: string, qualified: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ qualified }).where(eq(leads.email, email));
}

export async function updateLeadBooked(email: string, booked: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(leads).set({ booked }).where(eq(leads.email, email));
}

export async function updateLeadVslEngagement(email: string, data: { vslPlayed?: boolean; vslPercentWatched?: number }) {
  const db = await getDb();
  if (!db) return;
  const update: Partial<InsertLead> = {};
  if (data.vslPlayed !== undefined) update.vslPlayed = data.vslPlayed;
  if (data.vslPercentWatched !== undefined) update.vslPercentWatched = data.vslPercentWatched;
  if (Object.keys(update).length > 0) {
    await db.update(leads).set(update).where(eq(leads.email, email));
  }
}

export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function createBooking(data: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(bookings).values(data);
  if (data.calendlyEventUri) {
    const result = await db.select().from(bookings).where(eq(bookings.calendlyEventUri, data.calendlyEventUri)).limit(1);
    return result[0];
  }
  return undefined;
}

export async function getBookingByEventUri(uri: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(eq(bookings.calendlyEventUri, uri)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBookingStatus(eventUri: string, status: "active" | "canceled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ status }).where(eq(bookings.calendlyEventUri, eventUri));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getBookingsWithLeads() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      booking: bookings,
      lead: leads,
    })
    .from(bookings)
    .leftJoin(leads, eq(bookings.leadId, leads.id))
    .orderBy(desc(bookings.createdAt));
}

// ─── Funnel Config ────────────────────────────────────────────────────────────

export async function getConfigValue(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(funnelConfig).where(eq(funnelConfig.key, key)).limit(1);
  return result.length > 0 ? result[0].value : null;
}

export async function getAllConfig(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(funnelConfig);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function upsertConfig(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(funnelConfig)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
