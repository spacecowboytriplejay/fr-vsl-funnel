import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { hydrateFromUrl, funnelUrl, updateFunnelState } from "@/lib/funnelState";
import { FRNavLogoOnly, FRFooter, FRBlobDecoration } from "@/components/FRLayout";

// Multi-step qualification questions
const QUESTIONS = [
  {
    id: "capital",
    question: "What is your current investable capital position?",
    subtext: "We work with capital that is liquid and deployable. This helps us understand which structure fits your position.",
    options: [
      { label: "Less than R100,000", value: "under_100k", qualifies: false, band: "nurture", hardDisqualify: true },
      { label: "R100,000 to R500,000", value: "100k_500k", qualifies: true, band: "entry" },
      { label: "R500,000 to R5,000,000", value: "500k_5m", qualifies: true, band: "mid" },
      { label: "R5,000,000 to R50,000,000", value: "5m_50m", qualifies: true, band: "high" },
      { label: "Above R50,000,000", value: "above_50m", qualifies: true, band: "ultra" },
    ],
  },
  {
    id: "timeline",
    question: "When are you looking to deploy capital?",
    subtext: "We structure conversations around readiness. There's no pressure   just honesty.",
    options: [
      { label: "Just exploring for now", value: "exploring", qualifies: false },
      { label: "Within the next 6 months", value: "6_months", qualifies: false },
      { label: "Within the next 3 months", value: "3_months", qualifies: true },
      { label: "I'm ready now", value: "now", qualifies: true },
    ],
  },
  {
    id: "structure",
    question: "What best describes your current investment setup?",
    subtext: "This helps Christoff prepare the right context for your conversation.",
    options: [
      { label: "All in traditional banking / fixed deposits", value: "traditional", qualifies: true },
      { label: "Some exposure to equities or unit trusts", value: "equities", qualifies: true },
      { label: "Already in alternative structures", value: "alternative", qualifies: true },
      { label: "Not sure / prefer not to say", value: "unsure", qualifies: false },
    ],
  },
  {
    id: "advisor",
    question: "Do you currently work with a financial advisor?",
    subtext: "We work alongside existing advisors or independently   this is just context.",
    options: [
      { label: "Yes, and I'm happy with them", value: "happy", qualifies: false },
      { label: "Yes, but I'm looking for alternatives", value: "looking", qualifies: true },
      { label: "No, I manage my own capital", value: "self", qualifies: true },
      { label: "No, and I'm actively looking for guidance", value: "seeking", qualifies: true },
    ],
  },
  {
    id: "goal",
    question: "What is your primary goal for this capital?",
    subtext: "Be specific. The more honest you are, the more useful the conversation will be.",
    options: [
      { label: "Preserve capital   protect what I have", value: "preserve", qualifies: true },
      { label: "Generate consistent monthly income", value: "income", qualifies: true },
      { label: "Grow capital significantly over 3–5 years", value: "growth", qualifies: true },
      { label: "I'm not sure yet", value: "unsure", qualifies: false },
    ],
  },
];

type QualResult = "qualified" | "disqualified" | null;

export default function QualifyPage() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; qualifies: boolean }>>({});
  const [result, setResult] = useState<QualResult>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const qualify = trpc.leads.qualify.useMutation();

  useEffect(() => {
    const state = hydrateFromUrl();
    if (state?.email) setEmail(state.email);
  }, []);

  const totalSteps = QUESTIONS.length;
  const progressPct = ((currentStep) / totalSteps) * 100;
  const currentQ = QUESTIONS[currentStep];

  function handleContinue() {
    if (!selectedOption) return;
    const opt = currentQ.options.find((o) => o.value === selectedOption);
    if (!opt) return;

    const newAnswers = { ...answers, [currentQ.id]: { value: opt.value, qualifies: opt.qualifies } };
    setAnswers(newAnswers);
    setSelectedOption(null);

    // Hard disqualify immediately if capital is below R100,000
    if (currentQ.id === "capital" && (opt as { hardDisqualify?: boolean }).hardDisqualify) {
      setResult("disqualified");
      if (email) {
        qualify.mutate({ email, qualified: false });
        updateFunnelState({ qualified: false });
      }
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step: evaluate remaining answers
      const allAnswers = Object.values(newAnswers);
      const disqualifyCount = allAnswers.filter((a) => !a.qualifies).length;
      const qualified = disqualifyCount <= 1; // Allow 1 soft disqualifier on non-capital questions

      setResult(qualified ? "qualified" : "disqualified");

      if (email) {
        qualify.mutate({ email, qualified });
        updateFunnelState({ qualified });
      }

      if (qualified) {
        setTimeout(() => navigate(funnelUrl("/booking")), 1800);
      }
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedOption(null);
    }
  }

  // RESULT   QUALIFIED
  if (result === "qualified") {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "Inter, sans-serif" }}>
        <FRNavLogoOnly />

        {/* YOU QUALIFY section */}
        <section style={{ background: "#ffffff", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#665DA9",
                marginBottom: "1rem",
              }}
            >
              YOU QUALIFY   PRIVATE MARKET BAND
            </p>
            <h1
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(2.25rem, 5vw, 3.25rem)",
                fontWeight: 600,
                color: "#1A1A1A",
                lineHeight: 1.15,
                margin: "0 0 1.5rem",
              }}
            >
              You're inside our private market band.
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9375rem",
                color: "#6B7280",
                lineHeight: 1.65,
                margin: "0 0 1rem",
              }}
            >
              Your capital position places you inside our qualifying range. We will explore which structure fits your position and timeline.
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9375rem",
                color: "#6B7280",
                lineHeight: 1.65,
                margin: "0 0 2.5rem",
              }}
            >
              A senior member of the FR team will call you to understand your position and explore whether a phased private market entry or upcoming structure is the right next step.
            </p>

            {/* Capital band tabs */}
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                overflow: "hidden",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                marginBottom: "0",
              }}
            >
              {[
                { label: "Under R100k", sub: "Nurture path", active: false },
                { label: "R100k to R5m", sub: "You are here", active: true },
                { label: "R5m to R50m+", sub: "Direct access", active: false },
              ].map((band, i) => (
                <div
                  key={i}
                  style={{
                    padding: "1.25rem 1rem",
                    borderRight: i < 2 ? "1px solid #E5E7EB" : "none",
                    background: band.active ? "#ffffff" : "#F9F9F9",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Cormorant Garamond, Georgia, serif",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      color: band.active ? "#665DA9" : "#9CA3AF",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {band.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.7rem",
                      color: band.active ? "#665DA9" : "#9CA3AF",
                    }}
                  >
                    {band.sub}
                  </div>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div style={{ height: "3px", background: "#E5E7EB", borderRadius: "0 0 6px 6px" }}>
              <div style={{ width: "50%", height: "100%", background: "#665DA9", borderRadius: "0 0 0 6px" }} />
            </div>
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
              Three steps to your FR+ conversation
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
                  title: "Your details are received",
                  body: "A senior FR team member reviews your declared capital position and notes from your qualification survey within one business day.",
                },
                {
                  num: "02",
                  title: "We call you",
                  body: "Not a pitch. A diagnostic. We want to understand your current structures, tax context, and goals before we recommend anything.",
                },
                {
                  num: "03",
                  title: "A clean path forward",
                  body: "You'll leave the call with a view of whether a phased entry or an upcoming structure aligns with your position   and what that looks like in rands.",
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

        {/* CONFIRMED */}
        <section style={{ background: "#ffffff", padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ maxWidth: "540px", margin: "0 auto" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                border: "2px solid #AED136",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#AED136" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 600,
                color: "#1A1A1A",
                margin: "0 0 1rem",
              }}
            >
              Your details are confirmed
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9375rem",
                color: "#6B7280",
                lineHeight: 1.65,
                margin: "0 0 2rem",
              }}
            >
              A senior member of the FR team will contact you shortly. Calls are typically made within one business day of receiving your submission.
            </p>
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
                marginBottom: "1.5rem",
              }}
            >
              The conversation is completely free. No commitment. No pressure. You are in control.
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#9CA3AF" }}>
              Your reference is confirmed and logged
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#9CA3AF", marginTop: "0.5rem" }}>
              Redirecting to booking...
            </p>
          </div>
        </section>

        <FRFooter />
      </div>
    );
  }

  // RESULT   DISQUALIFIED
  if (result === "disqualified") {
    return (
      <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "Inter, sans-serif" }}>
        <FRNavLogoOnly />

        <section style={{ background: "#ffffff", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                border: "2px solid #F87171",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 600,
                color: "#1A1A1A",
                lineHeight: 1.15,
                margin: "0 0 1rem",
              }}
            >
              You're early. That's not a problem
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
              For our current private deals, the minimum investable amount is R100 000 and above. To protect both your capital and our existing investors, we hold that line   without exception
            </p>
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
                marginBottom: "0",
              }}
            >
              That doesn't mean you're not "our kind of investor". It just means your capital is at a stage where the best thing we can do is help you grow and structure it, so that when you cross the R100 000 mark, you're already thinking like a private market investor.
            </div>
          </div>
        </section>

        {/* WHAT WE'RE GIVING YOU INSTEAD */}
        <section style={{ background: "#F2F2F7", padding: "4rem 1.5rem" }}>
          <div style={{ maxWidth: "780px", margin: "0 auto" }}>
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
              WHAT WE'RE GIVING YOU INSTEAD
            </p>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 600,
                color: "#1A1A1A",
                margin: "0 0 2rem",
                lineHeight: 1.15,
              }}
            >
              The tools to become the kind of investor who qualifies.
            </h2>

            {/* Solo Investor Guide card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "8px",
                padding: "2rem",
                marginBottom: "1.25rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "3px",
                    padding: "0.25rem 0.625rem",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#6B7280",
                    marginBottom: "1rem",
                  }}
                >
                  FREE DOWNLOAD ↓
                </div>
                <h3
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: "1.625rem",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    margin: "0 0 0.75rem",
                  }}
                >
                  The Solo Investor Guide
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8125rem",
                    color: "#6B7280",
                    lineHeight: 1.6,
                    margin: "0 0 1.5rem",
                  }}
                >
                  A plain-language breakdown of how private market structures actually work   what we look for in a qualifying investor, how capital gets structured, and what the first R100 000 should be doing before it goes anywhere near a private deal.
                </p>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.875rem 1.75rem",
                    background: "#F15931",
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
                  DOWNLOAD FREE GUIDE
                </button>
              </div>
              <div>
                {[
                  { num: "01", text: "Why banks profit on your savings and what the spread looks like in rand." },
                  { num: "02", text: "How to structure your first R100k for private market readiness." },
                  { num: "03", text: "The difference between saving and investing most people confuse these two things their entire lives." },
                  { num: "04", text: "What asset-backed investing means in a South African context." },
                  { num: "05", text: "The three questions a private market investor asks before anything moves." },
                ].map((item) => (
                  <div
                    key={item.num}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      marginBottom: "0.875rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#665DA9",
                        flexShrink: 0,
                      }}
                    >
                      {item.num}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.8125rem",
                        color: "#374151",
                        lineHeight: 1.5,
                      }}
                      dangerouslySetInnerHTML={{ __html: item.text.replace(/^(.*?)(\s)/, '<strong>$1</strong>$2') }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Community card */}
            <div
              style={{
                background: "#665DA9",
                borderRadius: "8px",
                padding: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1.5rem",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "0.5rem",
                  }}
                >
                  PRIVATE COMMUNITY
                </p>
                <h3
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    margin: "0 0 0.75rem",
                  }}
                >
                  Join the FR+ Private Investor Community
                </h3>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 1.6,
                    margin: "0 0 1.25rem",
                  }}
                >
                  A closed group where Christoff shares market observations, deal structure breakdowns, and investor education   before anything becomes public. No noise. No selling. Just serious capital thinking.
                </p>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color: "#ffffff",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    border: "1.5px solid rgba(255,255,255,0.6)",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  JOIN THE COMMUNITY
                </button>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: "5rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}
                >
                  45
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Active private
                  <br />
                  investors inside
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHEN YOU'RE READY */}
        <section style={{ background: "#ffffff", padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
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
              WHEN YOU'RE READY
            </p>
            <h2
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 600,
                color: "#1A1A1A",
                margin: "0 0 1rem",
                lineHeight: 1.15,
              }}
            >
              We'll be here when your capital crosses the threshold.
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9375rem",
                color: "#6B7280",
                lineHeight: 1.65,
                margin: "0 0 2rem",
              }}
            >
              In the meantime, start thinking like a private market investor. Download the guide. Join the community. When the time comes, you'll be the kind of investor we want to work with.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                style={{
                  padding: "0.875rem 1.75rem",
                  background: "transparent",
                  color: "#F15931",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  border: "1.5px solid #F15931",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                DOWNLOAD THE GUIDE
              </button>
              <button
                style={{
                  padding: "0.875rem 1.75rem",
                  background: "#F15931",
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
                JOIN THE COMMUNITY
              </button>
            </div>
          </div>
        </section>

        <FRFooter />
      </div>
    );
  }

  // QUESTION FORM
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "Inter, sans-serif" }}>
      <FRNavLogoOnly />

      <section style={{ padding: "3rem 1.5rem", maxWidth: "600px", margin: "0 auto" }}>
        {/* Gold progress bar */}
        <div style={{ marginBottom: "0.5rem" }}>
          <div
            style={{
              height: "3px",
              background: "#F0EBE0",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "#B8923C",
                borderRadius: "2px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Step counter */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.75rem",
            color: "#B8923C",
            fontWeight: 600,
            marginBottom: "2.5rem",
          }}
        >
          Question {currentStep + 1} of {totalSteps}
        </p>

        {/* Question */}
        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 600,
            color: "#1A1A1A",
            lineHeight: 1.2,
            margin: "0 0 0.75rem",
          }}
        >
          {currentQ.question}
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
            color: "#6B7280",
            lineHeight: 1.6,
            margin: "0 0 2rem",
          }}
        >
          {currentQ.subtext}
        </p>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
          {currentQ.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedOption(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "1rem 1.25rem",
                background: selectedOption === opt.value ? "#F9F6F0" : "#ffffff",
                border: `1.5px solid ${selectedOption === opt.value ? "#B8923C" : "#E5E0D8"}`,
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: `2px solid ${selectedOption === opt.value ? "#B8923C" : "#D1C9BC"}`,
                  background: selectedOption === opt.value ? "#B8923C" : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedOption === opt.value && (
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ffffff" }} />
                )}
              </div>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.9375rem",
                  color: "#1A1A1A",
                  fontWeight: selectedOption === opt.value ? 500 : 400,
                }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Confidentiality note */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "2rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.75rem",
              color: "#9CA3AF",
            }}
          >
            Your answers are confidential and used solely to personalise your conversation.
          </span>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: "1rem" }}>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              style={{
                flex: 1,
                padding: "0.9375rem",
                background: "transparent",
                color: "#B8923C",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                border: "1.5px solid #B8923C",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              BACK
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!selectedOption}
            style={{
              flex: 2,
              padding: "0.9375rem",
              background: selectedOption ? "#B8923C" : "#D4C5A0",
              color: "#ffffff",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "3px",
              cursor: selectedOption ? "pointer" : "not-allowed",
              transition: "background 0.15s ease",
            }}
          >
            {currentStep === totalSteps - 1 ? "SUBMIT" : "CONTINUE"}
          </button>
        </div>
      </section>

      <FRFooter />
    </div>
  );
}
