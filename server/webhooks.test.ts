import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerWebhooks } from "./webhooks";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
const mockCreateBooking = vi.fn().mockResolvedValue(undefined);
const mockGetBookingByEventUri = vi.fn().mockResolvedValue(null);
const mockUpdateBookingStatus = vi.fn().mockResolvedValue(undefined);
const mockGetLeadByEmail = vi.fn().mockResolvedValue({ id: 1, email: "test@example.com" });
const mockUpdateLeadBooked = vi.fn().mockResolvedValue(undefined);
const mockNotifyOwner = vi.fn().mockResolvedValue(true);

vi.mock("./db", () => ({
  createBooking: (...args: unknown[]) => mockCreateBooking(...args),
  getBookingByEventUri: (...args: unknown[]) => mockGetBookingByEventUri(...args),
  updateBookingStatus: (...args: unknown[]) => mockUpdateBookingStatus(...args),
  getLeadByEmail: (...args: unknown[]) => mockGetLeadByEmail(...args),
  updateLeadBooked: (...args: unknown[]) => mockUpdateLeadBooked(...args),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: (...args: unknown[]) => mockNotifyOwner(...args),
}));

// ─── Test app setup ───────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  registerWebhooks(app);
  return app;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/calendly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBookingByEventUri.mockResolvedValue(null);
    mockGetLeadByEmail.mockResolvedValue({ id: 1, email: "test@example.com" });
  });

  it("handles invitee.created and creates a booking", async () => {
    const app = buildApp();
    const payload = {
      event: "invitee.created",
      payload: {
        email: "test@example.com",
        name: "Test User",
        uri: "https://api.calendly.com/scheduled_events/invitees/abc123",
        event: "https://api.calendly.com/scheduled_events/evt123",
        scheduled_event: {
          start_time: "2025-09-01T10:00:00Z",
        },
      },
    };

    const res = await request(app)
      .post("/api/webhooks/calendly")
      .send(payload)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.event).toBe("invitee.created");
    expect(mockCreateBooking).toHaveBeenCalledOnce();
    expect(mockUpdateLeadBooked).toHaveBeenCalledWith("test@example.com", true);
    expect(mockNotifyOwner).toHaveBeenCalledOnce();
  });

  it("handles invitee.canceled and reverts lead booked status", async () => {
    mockGetBookingByEventUri.mockResolvedValue({
      id: 5,
      inviteeEmail: "test@example.com",
      calendlyEventUri: "https://api.calendly.com/scheduled_events/evt123",
    });

    const app = buildApp();
    const payload = {
      event: "invitee.canceled",
      payload: {
        event: "https://api.calendly.com/scheduled_events/evt123",
      },
    };

    const res = await request(app)
      .post("/api/webhooks/calendly")
      .send(payload)
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.event).toBe("invitee.canceled");
    expect(mockUpdateBookingStatus).toHaveBeenCalledWith(
      "https://api.calendly.com/scheduled_events/evt123",
      "canceled"
    );
    expect(mockUpdateLeadBooked).toHaveBeenCalledWith("test@example.com", false);
  });

  it("returns 400 for missing event field", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/calendly")
      .send({ payload: {} })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("acknowledges unknown event types gracefully", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/calendly")
      .send({ event: "invitee.rescheduled", payload: {} })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body.event).toBe("unhandled");
  });

  it("does not call createBooking when invitee.created has no email", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/calendly")
      .send({
        event: "invitee.created",
        payload: { name: "No Email User" },
      })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    // createBooking is still called but with empty email
    expect(mockUpdateLeadBooked).not.toHaveBeenCalled();
  });
});
