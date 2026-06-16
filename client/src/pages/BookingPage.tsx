import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { hydrateFromUrl, funnelUrl, updateFunnelState } from "@/lib/funnelState";
import { FRNavLogoOnly, FRFooter, FRBlobDecoration } from "@/components/FRLayout";

// Hardcoded Calendly URL — FR+ Discovery Conversation (30 min)
const CALENDLY_URL = "https://calendly.com/jay-frplus/30min";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function BookingPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [booked, setBooked] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const scheduleTrackedRef = useRef(false);

  const markBooked = trpc.leads.markBooked.useMutation();

  useEffect(() => {
    const state = hydrateFromUrl();
    if (state?.email) setEmail(state.email);
    if (state?.name) setName(state.name ?? "");

    // Meta Pixel: InitiateCheckout fires when a qualified lead reaches the booking page
    if (typeof window.fbq === "function") {
      window.fbq("track", "InitiateCheckout");
    }
  }, []);

  // Inject Calendly widget script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    scriptRef.current = script;
    document.head.appendChild(script);
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
    };
  }, []);

  // Listen for Calendly booking confirmation
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.event === "calendly.event_scheduled") {
        if (!scheduleTrackedRef.current) {
          scheduleTrackedRef.current = true;
          // Meta Pixel: Schedule fires on confirmed booking
          if (typeof window.fbq === "function") {
            window.fbq("track", "Schedule");
          }
        }
        setBooked(true);
        updateFunnelState({ booked: true });
        if (email) markBooked.mutate({ email });
        setTimeout(() => navigate(funnelUrl("/confirmation")), 1500);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [email, navigate]);

  // Build prefilled Calendly URL
  const prefillParams = new URLSearchParams();
  if (email) prefillParams.set("email", email);
  if (name) prefillParams.set("name", name);
  prefillParams.set("hide_gdpr_banner", "1");
  prefillParams.set("background_color", "ffffff");
  prefillParams.set("text_color", "1A1A1A");
  prefillParams.set("primary_color", "665DA9");
  const fullCalendlyUrl = `${CALENDLY_URL}?${prefillParams.toString()}`;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "Inter, sans-serif" }}>
      <FRNavLogoOnly />

      {/* HEADER SECTION */}
      <section style={{ background: "#ffffff", padding: "4rem 1.5rem 2rem", textAlign: "center" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.625rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#665DA9",
              marginBottom: "0.75rem",
            }}
          >
            BOOK YOUR DISCOVERY CONVERSATION
          </p>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
              fontWeight: 600,
              color: "#1A1A1A",
              lineHeight: 1.15,
              margin: "0 0 1rem",
            }}
          >
            You qualify. Let's talk.
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.9375rem",
              color: "#6B7280",
              lineHeight: 1.65,
              margin: "0 0 2rem",
            }}
          >
            Select a time that works for you. The Discovery Conversation is 30 minutes, completely free, and designed to give you clarity, not a sales pitch.
          </p>

          {/* Trust badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              flexWrap: "wrap",
              marginBottom: "0",
            }}
          >
            {[
              { icon: "◇", label: "30 minutes" },
              { icon: "◈", label: "No obligation" },
              { icon: "◉", label: "Confidential" },
            ].map((badge) => (
              <div
                key={badge.label}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ color: "#665DA9", fontSize: "1rem" }}>{badge.icon}</span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8125rem",
                    color: "#6B7280",
                  }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALENDLY SECTION */}
      <section style={{ background: "#F9F9F9", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {booked ? (
            <div
              style={{
                textAlign: "center",
                padding: "5rem 2rem",
                background: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  border: "2px solid #AED136",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#AED136" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontSize: "2rem",
                  fontWeight: 600,
                  color: "#1A1A1A",
                  margin: "0 0 0.75rem",
                }}
              >
                Booking confirmed
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9375rem", color: "#6B7280" }}>
                Redirecting to your confirmation page...
              </p>
            </div>
          ) : (
            /* Calendly inline widget — hardcoded to jay-frplus/30min */
            <div
              className="calendly-inline-widget"
              data-url={fullCalendlyUrl}
              style={{
                minWidth: "320px",
                height: "700px",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #E5E7EB",
              }}
            />
          )}
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section
        style={{
          background: "#665DA9",
          padding: "4rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <FRBlobDecoration style={{ width: "280px", left: "-60px", top: "-40px" }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.625rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              textAlign: "center",
              marginBottom: "0.75rem",
            }}
          >
            WHAT TO EXPECT
          </p>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 500,
              color: "#ffffff",
              textAlign: "center",
              margin: "0 0 2.5rem",
            }}
          >
            The Discovery Conversation is not a sales call
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              {
                num: "01",
                title: "We listen first",
                body: "Christoff will ask about your current capital structure, what you're trying to achieve, and what's stopped you from getting there.",
              },
              {
                num: "02",
                title: "We give you a view",
                body: "Based on what you share, we'll tell you honestly whether a private market structure makes sense for your position right now.",
              },
              {
                num: "03",
                title: "No pressure. No pitch.",
                body: "If there's a fit, we'll explain what the next step looks like. If there isn't, we'll tell you that too. You leave with clarity either way.",
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{ background: "#ffffff", borderRadius: "6px", padding: "1.75rem 1.5rem" }}
              >
                <div
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: "2.5rem",
                    fontWeight: 600,
                    color: "#665DA9",
                    lineHeight: 1,
                    marginBottom: "0.75rem",
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    marginBottom: "0.5rem",
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.75rem",
                    color: "#6B7280",
                    lineHeight: 1.6,
                  }}
                >
                  {step.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FRFooter />
    </div>
  );
}
