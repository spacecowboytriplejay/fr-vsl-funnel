import { Router } from "express";
import { createBooking, getBookingByEventUri, getLeadByEmail, updateBookingStatus, updateLeadBooked } from "./db";
import { notifyOwner } from "./_core/notification";

export function registerWebhooks(app: Router) {
  /**
   * POST /api/webhooks/calendly
   * Handles Calendly invitee.created and invitee.canceled webhook events.
   * Calendly sends a JSON payload with event type and payload data.
   */
  app.post("/api/webhooks/calendly", async (req, res) => {
    try {
      const body = req.body as CalendlyWebhookPayload;

      if (!body || !body.event) {
        res.status(400).json({ error: "Invalid webhook payload" });
        return;
      }

      const { event, payload } = body;

      if (event === "invitee.created") {
        const inviteeEmail = payload?.email ?? "";
        const inviteeName = payload?.name ?? "";
        const eventUri = payload?.event ?? "";
        const inviteeUri = payload?.uri ?? "";
        const startTime = payload?.scheduled_event?.start_time;

        // Find matching lead by email
        const lead = inviteeEmail ? await getLeadByEmail(inviteeEmail) : undefined;

        // Create booking record
        await createBooking({
          leadId: lead?.id ?? null,
          calendlyEventUri: eventUri || null,
          calendlyInviteeUri: inviteeUri || null,
          inviteeEmail,
          inviteeName: inviteeName || null,
          scheduledTime: startTime ? new Date(startTime) : null,
          status: "active",
        });

        // Mark lead as booked
        if (inviteeEmail) {
          await updateLeadBooked(inviteeEmail, true);
        }

        // Notify owner
        await notifyOwner({
          title: "New Booking Confirmed",
          content: `${inviteeName || inviteeEmail} has booked a call${startTime ? ` for ${new Date(startTime).toLocaleString()}` : ""}.`,
        }).catch(() => {});

        res.status(200).json({ success: true, event: "invitee.created" });
        return;
      }

      if (event === "invitee.canceled") {
        const eventUri = payload?.event ?? "";
        if (eventUri) {
          await updateBookingStatus(eventUri, "canceled");
          // Also revert the lead's booked status so the admin dashboard reflects reality
          const existingBooking = await getBookingByEventUri(eventUri);
          if (existingBooking?.inviteeEmail) {
            await updateLeadBooked(existingBooking.inviteeEmail, false);
          }
        }
        res.status(200).json({ success: true, event: "invitee.canceled" });
        return;
      }

      // Unknown event type – acknowledge receipt
      res.status(200).json({ success: true, event: "unhandled" });
    } catch (err) {
      console.error("[Calendly Webhook] Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// ─── Calendly Webhook Payload Types ──────────────────────────────────────────

interface CalendlyWebhookPayload {
  event: string;
  payload: {
    email?: string;
    name?: string;
    uri?: string;
    event?: string;
    scheduled_event?: {
      start_time?: string;
      end_time?: string;
      uri?: string;
    };
  };
}
