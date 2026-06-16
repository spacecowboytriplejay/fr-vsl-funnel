import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { hydrateFromUrl, funnelUrl } from "@/lib/funnelState";
import {
  FRNav,
  FRFooter,
  FRBtnOrange,
  FRLabel,
  FRCalloutLime,
  FRBlobDecoration,
} from "@/components/FRLayout";

declare global {
  interface Window {
    _wq?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

interface WistiaPlayer {
  bind: (event: string, cb: (...args: unknown[]) => void) => void;
}

// TASK 3   FAQ answers updated per compliance requirements
const faqs = [
  {
    q: "Is there a minimum investment?",
    a: "FR+ works with investors placing R100,000 or more. The right structure depends on your capital position, discussed in the Discovery Conversation.",
  },
  {
    q: "How are returns structured?",
    a: "Each instrument is asset-backed, with a return profile agreed in the contract before capital is deployed. Specific terms are set out in the prospectus and discussed privately. All investments carry risk and capital is not guaranteed.",
  },
  {
    q: "Is FR+ regulated?",
    a: "FR Plus is an authorised financial services provider, FSP number 53986, in terms of Section 8 of the FAIS Act.",
  },
  {
    q: "What happens after the Discovery Conversation?",
    a: "You receive a proposed structure, the supporting documents, and time for your own due diligence. No capital moves until you are satisfied.",
  },
  {
    q: "How many investors does FR+ currently work with?",
    a: "FR+ is capped at 45 investors. When a spot opens, it fills from the application list first.",
  },
];

export default function VslPage() {
  const [, navigate] = useLocation();
  const [ctaVisible, setCtaVisible] = useState(false);
  const [percentWatched, setPercentWatched] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [exitEmail, setExitEmail] = useState("");
  const [exitSubmitted, setExitSubmitted] = useState(false);
  const stateRef = useRef<{ email: string; name?: string } | null>(null);
  const trackedPlayRef = useRef(false);
  const tracked50Ref = useRef(false);
  const highestPercentRef = useRef(0);

  const { data: config } = trpc.config.get.useQuery();
  const trackVsl = trpc.leads.trackVsl.useMutation();

  const threshold = config?.vslWatchThreshold ?? 50;
  const videoId = "oakvu3mkzx";

  useEffect(() => {
    const state = hydrateFromUrl();
    stateRef.current = state ? { email: state.email, name: state.name } : null;
  }, []);

  useEffect(() => {
    // Inject Wistia player.js and embed script for oakvu3mkzx
    const playerScript = document.createElement("script");
    playerScript.src = "https://fast.wistia.com/player.js";
    playerScript.async = true;
    document.head.appendChild(playerScript);

    const embedScript = document.createElement("script");
    embedScript.src = "https://fast.wistia.com/embed/oakvu3mkzx.js";
    embedScript.async = true;
    embedScript.type = "module";
    document.head.appendChild(embedScript);

    // Wistia queue for event tracking
    window._wq = window._wq || [];
    window._wq.push({
      id: videoId,
      onReady: (video: WistiaPlayer) => {
        video.bind("play", () => {
          // Fire Meta Pixel VSLPlay on first play + standard ViewContent
          if (!trackedPlayRef.current) {
            trackedPlayRef.current = true;
            if (typeof window.fbq === "function") {
              window.fbq("trackCustom", "VSLPlay");
              window.fbq("track", "ViewContent", { content_name: "VSL", content_category: "FR+ Private Investment" });
            }
            if (stateRef.current?.email) {
              trackVsl.mutate({ email: stateRef.current.email, vslPlayed: true });
            }
          }
        });
        video.bind("percentwatchedchanged", (pct: unknown) => {
          const p = Math.round((pct as number) * 100);
          if (p > highestPercentRef.current) {
            highestPercentRef.current = p;
            setPercentWatched(p);
            if (p >= threshold) setCtaVisible(true);
            // TASK 5   Fire Meta Pixel VSL50 event when 50% threshold is reached
            if (p >= 50 && !tracked50Ref.current) {
              tracked50Ref.current = true;
              if (typeof window.fbq === "function") {
                window.fbq("trackCustom", "VSL50");
              }
            }
            if (p % 25 === 0 && stateRef.current?.email) {
              trackVsl.mutate({ email: stateRef.current.email, vslPercentWatched: p });
            }
          }
        });
        video.bind("end", () => {
          setCtaVisible(true);
          if (stateRef.current?.email) {
            trackVsl.mutate({ email: stateRef.current.email, vslPercentWatched: 100 });
          }
        });
      },
    });

    return () => {
      try { document.head.removeChild(playerScript); } catch {}
      try { document.head.removeChild(embedScript); } catch {}
    };
  }, [threshold]);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "Inter, sans-serif" }}>
      {/* Dark nav */}
      <FRNav dark ctaHref="/qualify" ctaLabel="WATCH NOW →" />

      {/* VIDEO SECTION   dark */}
      <section style={{ background: "#1A1A1A", padding: "2.5rem 1.5rem 0" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          {/* Wistia embed   exact embed code from Wistia dashboard */}
          <div
            dangerouslySetInnerHTML={{
              __html: `
                <style>wistia-player[media-id='oakvu3mkzx']:not(:defined){background:center/contain no-repeat url('https://fast.wistia.com/embed/medias/oakvu3mkzx/swatch');display:block;filter:blur(5px);padding-top:56.25%;}</style>
                <wistia-player media-id="oakvu3mkzx" aspect="1.7777777777777777" style="width:100%;border-radius:4px;display:block;"></wistia-player>
              `,
            }}
          />
        </div>
      </section>

      {/* CTA BAR   dark */}
      <section style={{ background: "#1A1A1A", padding: "1.25rem 1.5rem 2rem" }}>
        <div
          style={{
            maxWidth: "780px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.65)",
              margin: 0,
            }}
          >
            {ctaVisible
              ? "Ready to take the next step"
              : `Watch ${threshold}% of the video to unlock booking (${percentWatched}%)`}
          </p>
          <button
            onClick={() => {
              // Meta Pixel: Lead fires when a viewer clicks to book after watching 50%
              if (typeof window.fbq === "function") {
                window.fbq("track", "Lead");
              }
              navigate(funnelUrl("/qualify"));
            }}
            disabled={!ctaVisible && !!videoId}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.625rem 1.5rem",
              background: "transparent",
              color: ctaVisible || !videoId ? "#F15931" : "rgba(255,255,255,0.25)",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border: `1.5px solid ${ctaVisible || !videoId ? "#F15931" : "rgba(255,255,255,0.2)"}`,
              borderRadius: "3px",
              cursor: ctaVisible || !videoId ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
          >
            BOOK MY DISCOVERY CONVERSATION →
          </button>
        </div>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
            marginTop: "0.5rem",
          }}
        >
          Watch before booking your Discovery Conversation.
        </p>
      </section>

      {/* THREE REASONS SECTION */}
      <section style={{ background: "#ffffff", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <FRLabel style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            THREE REASONS FR+ EXISTS
          </FRLabel>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
              fontWeight: 600,
              color: "#1A1A1A",
              textAlign: "center",
              margin: "0 0 3rem",
              lineHeight: 1.15,
            }}
          >
            What the Traditional Market Won't Give You
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2.5rem",
            }}
          >
            {[
              {
                icon: "◈",
                // TASK 2a   title unchanged
                title: "Asset-Backed",
                body: "Every instrument is secured against real, tangible assets. Your capital is not exposed to speculative market sentiment.",
              },
              {
                icon: "◇",
                // TASK 2a   title changed from "Controlled Returns" to "Structured Returns"
                // TASK 2a   body updated to remove guarantee language and add risk warning
                title: "Structured Returns",
                body: "Return profiles are structured and agreed in the contract before any capital is deployed. All investments carry risk and your capital is not guaranteed.",
              },
              {
                icon: "◉",
                title: "Tailor-Fit Design",
                body: "No two investors are the same. FR+ structures are built around your capital position, timeline, and risk appetite.",
              },
            ].map((item) => (
              <div key={item.title}>
                <div
                  style={{
                    fontSize: "2rem",
                    color: "#665DA9",
                    marginBottom: "0.875rem",
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    margin: "0 0 0.5rem",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8125rem",
                    color: "#6B7280",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTOR STORY */}
      {/* TASK 2b   investor story rewritten to remove specific figures; rewrote narrative */}
      <section
        style={{
          background: "#F9F9F9",
          padding: "3.5rem 1.5rem",
          borderTop: "1px solid #F0EEEA",
          borderBottom: "1px solid #F0EEEA",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <FRLabel style={{ marginBottom: "1.5rem" }}>INVESTOR STORY</FRLabel>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.9375rem",
              color: "#374151",
              lineHeight: 1.7,
              margin: "0 0 1.5rem",
            }}
          >
            Lebo had a significant sum sitting in a fixed deposit his advisor had called 'safe'. After one conversation with Christoff, he understood for the first time what opportunity cost actually looked like in rands.
          </p>
          <blockquote
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "1.25rem",
              fontStyle: "italic",
              color: "#1A1A1A",
              lineHeight: 1.5,
              margin: "0 0 1rem",
              padding: "0 1rem",
            }}
          >
            "I didn't know what I didn't know. That conversation changed how I think about every financial decision I've made since."
          </blockquote>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8125rem", color: "#9CA3AF", margin: 0 }}>
            Lebo, 34, Cape Town
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "#ffffff", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <FRLabel style={{ marginBottom: "1.5rem" }}>FREQUENTLY ASKED</FRLabel>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E5E7EB" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "1.25rem 0",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: "#1A1A1A",
                  textAlign: "left",
                }}
              >
                {faq.q}
                <span style={{ fontSize: "1.1rem", color: "#6B7280", flexShrink: 0, marginLeft: "1rem" }}>
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              {openFaq === i && (
                <div
                  style={{
                    paddingBottom: "1.25rem",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.875rem",
                    color: "#6B7280",
                    lineHeight: 1.65,
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* URGENCY + CTA */}
      <section
        style={{
          background: "#ffffff",
          padding: "0 1.5rem 4rem",
          maxWidth: "600px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <FRCalloutLime style={{ marginBottom: "2rem" }}>
          45 Investors. Every one has Christoff's personal number. Discovery conversations are limited.
        </FRCalloutLime>
        <FRBtnOrange
          onClick={() => navigate(funnelUrl("/qualify"))}
          style={{ minWidth: "320px", maxWidth: "100%" }}
        >
          BOOK MY DIRECT CONVERSATION →
        </FRBtnOrange>
      </section>

      {/* EXIT CAPTURE   purple */}
      <section
        style={{
          background: "#665DA9",
          padding: "4rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <FRBlobDecoration style={{ width: "300px", right: "-60px", top: "-40px" }} />
        <div style={{ maxWidth: "540px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              padding: "2.5rem",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "2rem",
                fontWeight: 600,
                color: "#1A1A1A",
                margin: "0 0 0.75rem",
              }}
            >
              Before you go
            </h3>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                color: "#6B7280",
                lineHeight: 1.6,
                margin: "0 0 1.5rem",
              }}
            >
              Download The Three Facts Report   a one-page summary of what the private market offers and what it costs your capital not to explore it.
            </p>
            {!exitSubmitted ? (
              <>
                <input
                  type="email"
                  placeholder="Your Email Address"
                  value={exitEmail}
                  onChange={(e) => setExitEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    border: "1px solid #E5E0D8",
                    borderRadius: "3px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.9375rem",
                    color: "#1A1A1A",
                    outline: "none",
                    marginBottom: "0.75rem",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={() => { if (exitEmail.trim()) setExitSubmitted(true); }}
                  style={{
                    width: "100%",
                    padding: "0.9375rem",
                    background: "#665DA9",
                    color: "#ffffff",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  SEND ME THE REPORT
                </button>
              </>
            ) : (
              <p style={{ color: "#665DA9", fontWeight: 600, fontSize: "0.9375rem" }}>
                Report sent! Check your inbox.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* TASK 2c   Risk/Disclaimer band directly above footer */}
      <section
        style={{
          background: "#F9F9F9",
          borderTop: "1px solid #E5E7EB",
          padding: "2rem 1.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.75rem",
            color: "#6B7280",
            lineHeight: 1.65,
            maxWidth: "780px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          All investments carry risk. Past performance is not indicative of future results. Your capital is not guaranteed. Returns are subject to the terms of the specific structure and the prospectus, available on request. FR Plus is an authorised financial services provider (FSP 53986) in terms of Section 8 of the FAIS Act.
        </p>
      </section>

      <FRFooter />
    </div>
  );
}
