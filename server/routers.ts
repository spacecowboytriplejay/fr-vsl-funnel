import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import {
  createLead,
  getAllBookings,
  getAllConfig,
  getAllLeads,
  getBookingsWithLeads,
  getLeadByEmail,
  updateLeadBooked,
  updateLeadQualified,
  updateLeadVslEngagement,
  upsertConfig,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Leads ──────────────────────────────────────────────────────────────────
  leads: router({
    capture: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          source: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const lead = await createLead({
          email: input.email,
          name: input.name,
          source: input.source ?? "organic",
        });

        // Notify funnel owner of new opt-in
        await notifyOwner({
          title: "New Lead Captured",
          content: `${input.name ?? input.email} (${input.email}) just opted in to the funnel.`,
        }).catch(() => {}); // non-blocking

        return { success: true, leadId: lead?.id };
      }),

    trackVsl: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          vslPlayed: z.boolean().optional(),
          vslPercentWatched: z.number().min(0).max(100).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateLeadVslEngagement(input.email, {
          vslPlayed: input.vslPlayed,
          vslPercentWatched: input.vslPercentWatched,
        });
        return { success: true };
      }),

    qualify: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          qualified: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        await updateLeadQualified(input.email, input.qualified);
        return { success: true };
      }),

    markBooked: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        await updateLeadBooked(input.email, true);
        return { success: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return getAllLeads();
    }),
  }),

  // ─── Bookings ────────────────────────────────────────────────────────────────
  bookings: router({
    listWithLeads: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return getBookingsWithLeads();
    }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return getAllBookings();
    }),
  }),

  // ─── Funnel Config ───────────────────────────────────────────────────────────
  config: router({
    get: publicProcedure.query(async () => {
      const config = await getAllConfig();
      return {
        vslWatchThreshold: parseInt(config["vsl_watch_threshold"] ?? "50", 10),
        calendlyUrl: config["calendly_url"] ?? "",
        vslVideoId: config["vsl_video_id"] ?? "",
        confirmationVideoId: config["confirmation_video_id"] ?? "",
      };
    }),

    update: protectedProcedure
      .input(
        z.object({
          vslWatchThreshold: z.number().min(1).max(100).optional(),
          calendlyUrl: z.string().url().optional(),
          vslVideoId: z.string().optional(),
          confirmationVideoId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }
        if (input.vslWatchThreshold !== undefined) {
          await upsertConfig("vsl_watch_threshold", String(input.vslWatchThreshold));
        }
        if (input.calendlyUrl !== undefined) {
          await upsertConfig("calendly_url", input.calendlyUrl);
        }
        if (input.vslVideoId !== undefined) {
          await upsertConfig("vsl_video_id", input.vslVideoId);
        }
        if (input.confirmationVideoId !== undefined) {
          await upsertConfig("confirmation_video_id", input.confirmationVideoId);
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
