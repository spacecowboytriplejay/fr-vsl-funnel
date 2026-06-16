import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Shared mock context helpers ─────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Mock DB helpers so tests don't need a real database ─────────────────────

vi.mock("./db", () => ({
  createLead: vi.fn().mockResolvedValue({ id: 42, email: "test@example.com" }),
  getLeadByEmail: vi.fn().mockResolvedValue({ id: 42, email: "test@example.com", qualified: false }),
  updateLeadQualified: vi.fn().mockResolvedValue(undefined),
  updateLeadBooked: vi.fn().mockResolvedValue(undefined),
  updateLeadVslEngagement: vi.fn().mockResolvedValue(undefined),
  getAllLeads: vi.fn().mockResolvedValue([]),
  getAllBookings: vi.fn().mockResolvedValue([]),
  getBookingsWithLeads: vi.fn().mockResolvedValue([]),
  getAllConfig: vi.fn().mockResolvedValue({
    vsl_watch_threshold: "50",
    calendly_url: "https://calendly.com/test/30min",
    vsl_video_id: "abc123",
    confirmation_video_id: "def456",
  }),
  upsertConfig: vi.fn().mockResolvedValue(undefined),
  createBooking: vi.fn().mockResolvedValue(undefined),
  getBookingByEventUri: vi.fn().mockResolvedValue(undefined),
  updateBookingStatus: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// Mock notifyOwner to prevent network calls
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("leads.capture", () => {
  it("creates a lead and returns success with leadId", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.capture({ email: "test@example.com", name: "Test User" });
    expect(result.success).toBe(true);
    expect(result.leadId).toBe(42);
  });

  it("accepts a lead without a name", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.capture({ email: "noname@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.leads.capture({ email: "not-an-email" })).rejects.toThrow();
  });
});

describe("leads.qualify", () => {
  it("marks a lead as qualified", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.qualify({ email: "test@example.com", qualified: true });
    expect(result.success).toBe(true);
  });

  it("marks a lead as disqualified", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.qualify({ email: "test@example.com", qualified: false });
    expect(result.success).toBe(true);
  });
});

describe("leads.trackVsl", () => {
  it("tracks VSL play event", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.trackVsl({ email: "test@example.com", vslPlayed: true });
    expect(result.success).toBe(true);
  });

  it("tracks percent watched", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.trackVsl({ email: "test@example.com", vslPercentWatched: 75 });
    expect(result.success).toBe(true);
  });

  it("rejects percent watched out of range", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.leads.trackVsl({ email: "test@example.com", vslPercentWatched: 150 })
    ).rejects.toThrow();
  });
});

describe("config.get", () => {
  it("returns funnel configuration with correct types", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const config = await caller.config.get();
    expect(config.vslWatchThreshold).toBe(50);
    expect(config.calendlyUrl).toBe("https://calendly.com/test/30min");
    expect(config.vslVideoId).toBe("abc123");
    expect(config.confirmationVideoId).toBe("def456");
  });
});

describe("config.update", () => {
  it("allows admin to update config", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.config.update({ vslWatchThreshold: 75 });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin update", async () => {
    const ctx = createPublicContext();
    ctx.user = {
      id: 2,
      openId: "user-open-id",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.config.update({ vslWatchThreshold: 75 })).rejects.toThrow("Admin access required");
  });

  it("rejects threshold above 100", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.config.update({ vslWatchThreshold: 101 })).rejects.toThrow();
  });
});

describe("leads.markBooked", () => {
  it("marks a lead as booked", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.markBooked({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
