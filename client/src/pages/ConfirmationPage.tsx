import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { hydrateFromUrl, clearFunnelState } from "@/lib/funnelState";
import { FRNavLogoOnly, FRFooter, FRBlobDecoration } from "@/components/FRLayout";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function ConfirmationPage() {
  const [name, setName] = useState("");
  const { data: config } = trpc.config.get.useQuery();
  const confirmationVideoId = config?.confirmationVideoId ?? "";

  useEffect(() => {
    const state = hydrateFromUrl();
    if (state?.name) setName(state.name);
    clearFunnelState();

    // Meta Pixel: CompleteRegistration fires when a booked lead lands on confirmation
    if (typeof window.fbq === "function") {
      window.fbq("track", "CompleteRegistration");
    }
  }, []);

  useEffect(() => {
    if (!confirmationVideoId) return;
    const script = document.createElement("script");
    script.src = `https://fast.wistia.com/embed/${confirmationVideoId}.js`;
    script.async = true;
    script.type = "module";
    document.head.appendChild(script);
    const playerScript = document.createElement("script");
    playerScript.src = "https://fast.wistia.com/player.js";
    playerScript.async = true;
    document.head.appendChild(playerScript);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
      if (document.head.contains(playerScript)) document.head.removeChild(playerScript);
    };
  }, [confirmationVideoId]);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "Inter, sans-serif" }}>
      <FRNavLogoOnly />

      {/* CONFIRMED HERO */}
      <section style={{ background: "#ffffff", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* Green check */}
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
            DISCOVERY CONVERSATION CONFIRMED
          </p>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              fontWeight: 600,
              color: "#1A1A1A",
              lineHeight: 1.1,
              margin: "0 0 1rem",
            }}
          >
            {name ? `${name}, you're confirmed.` : "You're confirmed."}
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
            Your Discovery Conversation is booked. A calendar invite with the call details has been sent to your inbox. Watch the short video below before your call.
          </p>

          {/* Lime callout */}
          <div
            style={{
              background: "#AED136",
              color: "#3A4A10",
              padding: "1rem 1.5rem",
              borderRadius: "4px",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            This conversation is confidential. Christoff personally reviews every submission before the call. Come prepared to be honest about your position.
          </div>
        </div>
      </section>

      {/* WATCH BEFORE YOUR CALL   dark */}
      <section style={{ background: "#1A1A1A", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.625rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            WATCH BEFORE YOUR CALL
          </p>
          {confirmationVideoId ? (
            <div
              className={`wistia_embed wistia_async_${confirmationVideoId} videoFoam=true`}
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                borderRadius: "4px",
              }}
            />
          ) : (
            <div
              style={{
                background: "#000000",
                borderRadius: "4px",
                aspectRatio: "16/9",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#665DA9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Expectation-setting video will appear here
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Set your Confirmation Video ID in the Admin Dashboard
              </p>
            </div>
          )}
        </div>
      </section>

      {/* WHAT HAPPENS NEXT   purple */}
      <section
        style={{
          background: "#665DA9",
          padding: "4rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <FRBlobDecoration style={{ width: "300px", right: "-60px", bottom: "-40px" }} />
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
            WHAT HAPPENS NEXT
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
            Three things to do before the call
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              {
                num: "01",
                title: "Check your email",
                body: "A calendar invite with the call link has been sent. Add it to your calendar now so you don't miss it.",
              },
              {
                num: "02",
                title: "Watch the video above",
                body: "Christoff explains exactly what the call covers and what you should prepare. It's 4 minutes. Watch it.",
              },
              {
                num: "03",
                title: "Know your numbers",
                body: "Come prepared with your current capital position, what it's currently doing, and what you want it to do instead.",
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  background: "#ffffff",
                  borderRadius: "6px",
                  padding: "1.75rem 1.5rem",
                }}
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

      {/* ABOUT CHRISTOFF */}
      <section style={{ background: "#F9F9F9", padding: "4rem 1.5rem", borderTop: "1px solid #F0EEEA" }}>
        <div
          style={{
            maxWidth: "780px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                width: "100%",
                paddingBottom: "120%",
                background: "#E5E0D8",
                borderRadius: "4px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CA3AF",
                  fontSize: "0.75rem",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Photo
              </div>
            </div>
          </div>
          <div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#B8923C",
                marginBottom: "0.75rem",
              }}
            >
              YOUR CONVERSATION PARTNER
            </p>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 600,
                color: "#1A1A1A",
                margin: "0 0 1rem",
              }}
            >
              Christoff Laubscher
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                color: "#6B7280",
                lineHeight: 1.7,
                margin: "0 0 1rem",
              }}
            >
              Christoff is the founder of FR Plus and has spent the last decade structuring private market instruments for South African investors. He does not do sales calls. He does diagnostic conversations.
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                color: "#6B7280",
                lineHeight: 1.7,
                margin: "0 0 1.5rem",
              }}
            >
              Every investor FR+ works with has Christoff's personal number. That's not a marketing line. It's how the model works.
            </p>
            <div style={{ display: "flex", gap: "2rem" }}>
              {[
                { num: "45", label: "Active investors" },
                { num: "10+", label: "Years structuring" },
                { num: "FSP 53986", label: "FAIS authorised" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontFamily: "Cormorant Garamond, Georgia, serif",
                      fontSize: "1.75rem",
                      fontWeight: 600,
                      color: "#1A1A1A",
                      lineHeight: 1,
                    }}
                  >
                    {stat.num}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.75rem",
                      color: "#9CA3AF",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER NOTE */}
      <section style={{ background: "#ffffff", padding: "2rem 1.5rem", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.75rem",
            color: "#9CA3AF",
          }}
        >
          Questions before the call? Reply to your confirmation email and we'll get back to you within one business day.
        </p>
      </section>

      <FRFooter />
    </div>
  );
}
