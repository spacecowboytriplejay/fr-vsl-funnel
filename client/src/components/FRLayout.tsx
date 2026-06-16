import { Link } from "wouter";

// FR+ Logo SVG component
export function FRLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "2px", cursor: "pointer" }}>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "1.375rem",
            color: dark ? "#ffffff" : "#1A1A1A",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          FR
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "1.375rem",
            color: "#665DA9",
            lineHeight: 1,
          }}
        >
          +
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            fontSize: "0.45rem",
            color: "#665DA9",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            alignSelf: "flex-start",
            marginTop: "2px",
          }}
        >
          PLUS
        </span>
      </div>
    </Link>
  );
}

// FR+ Nav
export function FRNav({
  dark = false,
  ctaHref = "/vsl",
  ctaLabel = "WATCH NOW →",
}: {
  dark?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.125rem 2rem",
        background: dark ? "#1A1A1A" : "#ffffff",
        borderBottom: dark ? "1px solid #333" : "1px solid #E8E8E8",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <FRLogo dark={dark} />
      <Link href={ctaHref} style={{ textDecoration: "none" }}>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1.125rem",
            background: "transparent",
            color: dark ? "#ffffff" : "#1A1A1A",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            border: `1.5px solid ${dark ? "#ffffff" : "#1A1A1A"}`,
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {ctaLabel}
        </button>
      </Link>
    </nav>
  );
}

// FR+ Logo-only Nav (for qualify page)
export function FRNavLogoOnly({ dark = false }: { dark?: boolean }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        padding: "1.125rem 2rem",
        background: dark ? "#1A1A1A" : "#ffffff",
        borderBottom: dark ? "1px solid #333" : "1px solid #E8E8E8",
      }}
    >
      <FRLogo dark={dark} />
    </nav>
  );
}

// FR+ Footer
export function FRFooter() {
  return (
    <>
      <footer
        style={{
          background: "#1A1A1A",
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <FRLogo dark />
        <span
          style={{
            color: "rgba(255,255,255,0.6)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.8rem",
            letterSpacing: "0.05em",
          }}
        >
          Private Investment | South Africa
        </span>
      </footer>
      <div
        style={{
          background: "#665DA9",
          padding: "0.625rem 2rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.65rem",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          FR Plus is an authorised financial services provider (FSP number 53986) in terms of Section 8 of the FAIS Act.
        </p>
      </div>
    </>
  );
}

// Orange CTA Button
export function FRBtnOrange({
  children,
  onClick,
  href,
  style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  style?: React.CSSProperties;
}) {
  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.9375rem 2.5rem",
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
    textDecoration: "none",
    transition: "background 0.15s ease-out, transform 0.1s ease-out",
    ...style,
  };

  if (href) {
    return (
      <Link href={href} style={btnStyle as React.CSSProperties}>
        {children}
      </Link>
    );
  }

  return (
    <button style={btnStyle} onClick={onClick}>
      {children}
    </button>
  );
}

// Orange Outlined Button
export function FRBtnOutlineOrange({
  children,
  onClick,
  href,
  style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  style?: React.CSSProperties;
}) {
  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.9375rem 2.5rem",
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
    textDecoration: "none",
    transition: "all 0.15s ease-out",
    ...style,
  };

  if (href) {
    return (
      <Link href={href} style={btnStyle as React.CSSProperties}>
        {children}
      </Link>
    );
  }

  return (
    <button style={btnStyle} onClick={onClick}>
      {children}
    </button>
  );
}

// Gold CTA Button
export function FRBtnGold({
  children,
  onClick,
  href,
  style = {},
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.9375rem 2.5rem",
    background: disabled ? "#D4C5A0" : "#B8923C",
    color: "#ffffff",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    border: "none",
    borderRadius: "3px",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none",
    transition: "background 0.15s ease-out, transform 0.1s ease-out",
    ...style,
  };

  if (href && !disabled) {
    return (
      <Link href={href} style={btnStyle as React.CSSProperties}>
        {children}
      </Link>
    );
  }

  return (
    <button style={btnStyle} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// Purple section label
export function FRLabel({
  children,
  gold = false,
  style = {},
}: {
  children: React.ReactNode;
  gold?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "0.625rem",
        fontWeight: 600,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: gold ? "#B8923C" : "#665DA9",
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// Lime green callout box
export function FRCalloutLime({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
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
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Blob SVG decoration (used in purple sections)
export function FRBlobDecoration({
  style = {},
}: {
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        opacity: 0.15,
        pointerEvents: "none",
        ...style,
      }}
    >
      <path
        fill="#FFFFFF"
        d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-1C87,14.2,81.4,28.4,73.2,40.8C65,53.2,54.2,63.8,41.4,70.8C28.6,77.8,13.8,81.2,-0.9,82.6C-15.6,84,-31.2,83.4,-44.2,76.4C-57.2,69.4,-67.6,56,-74.8,41.2C-82,26.4,-86,10.2,-84.4,-5.6C-82.8,-21.4,-75.6,-36.8,-65.4,-49.2C-55.2,-61.6,-42,-71,-28.2,-77.8C-14.4,-84.6,-0.4,-88.8,13.2,-87.2C26.8,-85.6,30.6,-83.6,44.7,-76.4Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}
