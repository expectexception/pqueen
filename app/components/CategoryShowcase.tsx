"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ShowcaseCard } from "@/lib/showcase";

/* ─────────────────────────────────────────
   INLINE SVG DECORATIONS (EMERALD & GOLD)
───────────────────────────────────────── */

const GoldDiamond = ({ size = 8, opacity = 0.7 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ opacity, display: "inline-block", flexShrink: 0 }}>
    <polygon points="6,0 12,6 6,12 0,6" fill="#c59b27" />
  </svg>
);

const EmeraldDiamond = ({ size = 8, opacity = 0.7 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ opacity, display: "inline-block", flexShrink: 0 }}>
    <polygon points="6,0 12,6 6,12 0,6" fill="#0d4428" />
  </svg>
);

const Sparkle = ({ size = 14, color = "#c59b27" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L13.2 9.2L20 9L14.5 13.5L16.5 21L12 16.5L7.5 21L9.5 13.5L4 9L10.8 9.2L12 2Z" fill={color} />
  </svg>
);

const FleurDeLis = ({ size = 28, opacity = 0.25 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 120" fill="none" style={{ opacity }}>
    <path d="M50 5 C42 18 48 30 50 35 C52 30 58 18 50 5Z" fill="#0d4428" />
    <path d="M50 35 C38 28 28 32 28 48 C38 44 46 40 50 35Z" fill="#0d4428" />
    <path d="M50 35 C62 28 72 32 72 48 C62 44 54 40 50 35Z" fill="#0d4428" />
    <ellipse cx="50" cy="56" rx="7" ry="6" fill="#c59b27" />
    <path d="M50 63 L50 90" stroke="#0d4428" strokeWidth="3" strokeLinecap="round" />
    <path d="M36 74 Q50 70 64 74" stroke="#c59b27" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

/* Hanging banner — Royal Emerald & Gold */
const HangingBanner = ({ label, index }: { label: string; index: number }) => (
  <>
    <svg width="128" height="62" viewBox="0 0 128 62" fill="none">
      {/* String left */}
      <line x1="38" y1="0" x2="24" y2="22" stroke="#c59b27" strokeWidth="1.2" strokeOpacity="0.7" strokeDasharray="2.5 2" />
      {/* String right */}
      <line x1="90" y1="0" x2="104" y2="22" stroke="#c59b27" strokeWidth="1.2" strokeOpacity="0.7" strokeDasharray="2.5 2" />
      {/* Banner body */}
      <path d="M14 22 H114 L122 44 L64 56 L6 44 Z" fill="#072818" />
      <path d="M14 22 H114 L122 44 L64 56 L6 44 Z" fill="none" stroke="#c59b27" strokeWidth="1" strokeOpacity="0.8" />
      {/* Gold inner border */}
      <path d="M22 26 H106 L113 42 L64 50 L15 42 Z" fill="none" stroke="#c59b27" strokeWidth="0.5" strokeOpacity="0.5" />
      {/* Notches */}
      <path d="M6 44 L14 56 L22 44" fill="#041a10" />
      <path d="M122 44 L114 56 L106 44" fill="#041a10" />
      <text x="64" y="40" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#f5d77f" letterSpacing="2.2" fontFamily="system-ui, sans-serif">
        {label}
      </text>
    </svg>
    <style>{`
      @keyframes sway${index} {
        0%, 100% { transform: translateX(-50%) rotate(-2deg); }
        50% { transform: translateX(-50%) rotate(2deg); }
      }
    `}</style>
  </>
);

/* Subtle SVG tile patterns */
const BgPattern = ({ id, type }: { id: string; type?: string }) => {
  if (type === "dots") return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }}>
      <defs>
        <pattern id={id} x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="1.8" fill="#0d4428" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
  if (type === "lines") return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.045, pointerEvents: "none" }}>
      <defs>
        <pattern id={id} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <line x1="0" y1="14" x2="28" y2="14" stroke="#0d4428" strokeWidth="0.6" />
          <line x1="14" y1="0" x2="14" y2="28" stroke="#0d4428" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }}>
      <defs>
        <pattern id={id} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 16 L16 0 L32 16 L16 32 Z" stroke="#0d4428" strokeWidth="0.7" fill="none" />
          <circle cx="16" cy="16" r="2" fill="#c59b27" fillOpacity="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

/* DEFAULT FALLBACK CATEGORIES */
const INITIAL_CATEGORIES: ShowcaseCard[] = [
  {
    id: "showcase-lehengas",
    slug: "lehengas",
    label: "LEHENGAS",
    name: "Bridal & Party Lehengas",
    desc: "Intricate zari, sequin & gold threadwork",
    ribbon: "BRIDAL",
    tag: "MOST LOVED",
    emoji: "👑",
    bgTone: "#f5f9f6",
    borderColor: "#cce2d3",
    accentDot: "#0d4428",
    pattern: "lattice",
    order: 1,
  },
  {
    id: "showcase-suit-sets",
    slug: "suit-sets",
    label: "SUIT SETS",
    name: "Designer Suit Sets",
    desc: "Anarkalis, straight cuts & shararas",
    ribbon: "DESIGNER",
    tag: "NEW SEASON",
    emoji: "✨",
    bgTone: "#faf8f3",
    borderColor: "#e8dfcc",
    accentDot: "#c59b27",
    pattern: "dots",
    order: 2,
  },
  {
    id: "showcase-dresses",
    slug: "dresses",
    label: "DRESSES",
    name: "Couture Dresses",
    desc: "Evening gowns & contemporary fits",
    ribbon: "COUTURE",
    tag: "FEATURED",
    emoji: "🌙",
    bgTone: "#f5f9f6",
    borderColor: "#cce2d3",
    accentDot: "#0d4428",
    pattern: "lines",
    order: 3,
  },
  {
    id: "showcase-sarees",
    slug: "sarees",
    label: "SAREES",
    name: "Royal Sarees",
    desc: "Banarasi, organza & pre-draped luxury",
    ribbon: "ROYAL",
    tag: "HERITAGE",
    emoji: "🌺",
    bgTone: "#faf8f3",
    borderColor: "#e8dfcc",
    accentDot: "#c59b27",
    pattern: "lattice",
    order: 4,
  },
  {
    id: "showcase-kurtis",
    slug: "kurtis",
    label: "KURTIS",
    name: "Festive Kurtis",
    desc: "Everyday elegance & festive flair",
    ribbon: "FESTIVE",
    tag: "BESTSELLER",
    emoji: "🔥",
    bgTone: "#f5f9f6",
    borderColor: "#cce2d3",
    accentDot: "#0d4428",
    pattern: "dots",
    order: 5,
  },
  {
    id: "showcase-new-arrivals",
    slug: "new-arrivals",
    label: "NEW ARRIVALS",
    name: "New Season Arrivals",
    desc: "Fresh off the designer atelier",
    ribbon: "NEW IN",
    tag: "JUST IN",
    emoji: "💫",
    bgTone: "#faf8f3",
    borderColor: "#e8dfcc",
    accentDot: "#c59b27",
    pattern: "lines",
    order: 6,
  },
];

/* ─────────────────────────────────────────
   CATEGORY CARD
───────────────────────────────────────── */
function CategoryCard({ cat, index, large }: { cat: ShowcaseCard; index: number; large?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setTimeout(() => setVisible(true), index * 85); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [index]);

  const hasBgImage = Boolean(cat.image && cat.image.trim().length > 0);
  const accentDot = cat.accentDot || (index % 2 === 0 ? "#0d4428" : "#c59b27");
  const bgTone = cat.bgTone || (index % 2 === 0 ? "#f5f9f6" : "#faf8f3");
  const borderColor = cat.borderColor || (index % 2 === 0 ? "#cce2d3" : "#e8dfcc");

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)",
        transition: `opacity 0.65s ease ${index * 0.07}s, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.07}s`,
      }}
    >
      <Link
        href={cat.slug.startsWith("/") ? cat.slug : `/shop?category=${cat.slug}`}
        style={{ display: "block", textDecoration: "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            position: "relative",
            borderRadius: "10px",
            overflow: "hidden",
            minHeight: large ? "300px" : "240px",
            background: hovered
              ? (hasBgImage ? "#072818" : "#ffffff")
              : (hasBgImage ? "#072818" : bgTone),
            border: `1px solid ${hovered ? "#c59b27" : borderColor}`,
            boxShadow: hovered
              ? `0 20px 48px rgba(7, 40, 24, 0.18), 0 4px 16px rgba(197, 155, 39, 0.15), inset 0 0 0 1px #c59b2755`
              : "0 2px 10px rgba(13, 31, 19, 0.05), 0 1px 3px rgba(13, 31, 19, 0.04)",
            transform: hovered ? "translateY(-6px) scale(1.018)" : "translateY(0) scale(1)",
            transition: "all 0.42s cubic-bezier(0.16, 1, 0.3, 1)",
            cursor: "pointer",
          }}
        >
          {/* CUSTOM BACKGROUND IMAGE OR TILE PATTERN */}
          {hasBgImage ? (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 1 }}>
              <img
                src={cat.image!}
                alt={cat.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: hovered ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.5s ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(7, 40, 24, 0.35) 0%, rgba(7, 40, 24, 0.7) 50%, rgba(7, 40, 24, 0.94) 100%)",
                }}
              />
            </div>
          ) : (
            <BgPattern id={`pat-${cat.slug || index}`} type={cat.pattern} />
          )}

          {/* CORNER DIAMONDS */}
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: "4px", zIndex: 3 }}>
            <GoldDiamond size={5} opacity={0.6} />
            <GoldDiamond size={7} opacity={0.9} />
            <GoldDiamond size={5} opacity={0.6} />
          </div>
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: "4px", zIndex: 3 }}>
            <GoldDiamond size={5} opacity={0.6} />
            <GoldDiamond size={7} opacity={0.9} />
            <GoldDiamond size={5} opacity={0.6} />
          </div>

          {/* HANGING BANNER */}
          {cat.ribbon && (
            <div
              style={{
                position: "absolute",
                top: "-3px",
                left: "50%",
                zIndex: 10,
                lineHeight: 0,
                animation: `sway${index} ${3.5 + (index % 3) * 0.8}s ease-in-out infinite`,
                animationDelay: `${index * 0.4}s`,
              }}
            >
              <HangingBanner label={cat.ribbon} index={index} />
            </div>
          )}

          {/* STATUS TAG */}
          {cat.tag && (
            <div style={{
              position: "absolute", top: "66px", right: "12px", zIndex: 4,
              background: hasBgImage
                ? "rgba(7, 40, 24, 0.85)"
                : (accentDot === "#c59b27"
                    ? "linear-gradient(135deg, #faf4e6, #f5e9c0)"
                    : "linear-gradient(135deg, #eaf4ed, #d8ecd8)"),
              border: `1px solid ${hasBgImage ? "#c59b27" : accentDot + "40"}`,
              borderRadius: "20px",
              padding: "2px 9px",
              fontSize: "8.5px", fontWeight: "800", letterSpacing: "1.5px",
              color: hasBgImage ? "#f5d77f" : accentDot,
              textTransform: "uppercase",
              backdropFilter: hasBgImage ? "blur(4px)" : "none",
            }}>
              {cat.tag}
            </div>
          )}

          {/* HOVER EMERALD/GOLD TINT OVERLAY */}
          {!hasBgImage && (
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 80%, rgba(13, 68, 40, 0.05) 0%, transparent 70%)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.4s ease",
              pointerEvents: "none",
            }} />
          )}

          {/* CONTENT */}
          <div style={{
            position: "relative", zIndex: 5,
            padding: large ? "74px 22px 26px 22px" : "70px 20px 20px 20px",
            display: "flex", flexDirection: "column",
            justifyContent: "flex-end",
            height: "100%", minHeight: "inherit",
          }}>
            {/* EMOJI */}
            {cat.emoji && (
              <div style={{
                fontSize: large ? "36px" : "28px",
                marginBottom: "8px",
                transform: hovered ? "scale(1.18) translateY(-3px)" : "scale(1)",
                transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                lineHeight: 1,
              }}>
                {cat.emoji}
              </div>
            )}

            {/* EYEBROW */}
            <div style={{
              display: "flex", alignItems: "center", gap: "5px",
              fontSize: "9px", fontWeight: "800", letterSpacing: "3px",
              textTransform: "uppercase",
              color: hasBgImage ? "#f5d77f" : accentDot,
              marginBottom: "5px",
            }}>
              <GoldDiamond size={5} opacity={1} />
              {cat.label || cat.slug}
            </div>

            {/* TITLE */}
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: large ? "20px" : "16.5px",
              fontWeight: "700",
              color: hasBgImage ? "#ffffff" : "#152018",
              lineHeight: "1.25",
              margin: "0 0 5px 0",
              textShadow: hasBgImage ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
            }}>
              {cat.name}
            </h3>

            {/* DESC */}
            <p style={{
              fontSize: "12px",
              color: hasBgImage ? "rgba(255,255,255,0.85)" : "#4a6350",
              margin: "0 0 14px 0",
              lineHeight: "1.4",
            }}>
              {cat.desc}
            </p>

            {/* ORNAMENT DIVIDER */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <div style={{ flex: 1, height: "1px", background: hasBgImage ? "linear-gradient(90deg, transparent, rgba(197,155,39,0.7))" : `linear-gradient(90deg, transparent, ${accentDot}50)` }} />
              <GoldDiamond size={5} opacity={0.7} />
              <div style={{ flex: 1, height: "1px", background: hasBgImage ? "linear-gradient(270deg, transparent, rgba(197,155,39,0.7))" : `linear-gradient(270deg, transparent, ${accentDot}50)` }} />
            </div>

            {/* CTA */}
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "10.5px", fontWeight: "800",
              letterSpacing: "1.5px", textTransform: "uppercase",
              color: hasBgImage ? "#f5d77f" : accentDot,
            }}>
              DISCOVER STYLES
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{
                transform: hovered ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.3s ease",
              }}>
                <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function CategoryShowcase() {
  const [categories, setCategories] = useState<ShowcaseCard[]>(INITIAL_CATEGORIES);

  useEffect(() => {
    async function loadShowcase() {
      try {
        const res = await fetch("/api/showcase");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.cards) && data.cards.length > 0) {
            setCategories(data.cards);
          }
        }
      } catch (err) {
        console.warn("Failed to load live showcase cards, using defaults:", err);
      }
    }
    loadShowcase();
  }, []);

  const topRow = categories.slice(0, 3);
  const bottomRow = categories.slice(3);

  return (
    <section style={{
      background: "linear-gradient(180deg, #072818 0%, #0d4428 18%, #f6f8f6 52%, #ffffff 100%)",
      padding: "80px 0 70px 0",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* BACKGROUND ORNAMENTS */}
      <div style={{ position: "absolute", top: 40, left: "4%", pointerEvents: "none" }}>
        <FleurDeLis size={54} opacity={0.12} />
      </div>
      <div style={{ position: "absolute", top: 40, right: "4%", pointerEvents: "none" }}>
        <FleurDeLis size={54} opacity={0.12} />
      </div>

      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* SECTION HEADER */}
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          {/* Eyebrow */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(197, 155, 39, 0.15)",
            border: "1px solid rgba(197, 155, 39, 0.4)",
            borderRadius: "24px",
            padding: "5px 16px",
            marginBottom: "16px",
          }}>
            <Sparkle size={11} color="#f5d77f" />
            <span style={{ fontSize: "10.5px", fontWeight: "800", letterSpacing: "2.5px", color: "#f5d77f", textTransform: "uppercase" }}>
              CURATED HAUTE COUTURE
            </span>
            <Sparkle size={11} color="#f5d77f" />
          </div>

          {/* Heading */}
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(30px, 4.5vw, 48px)",
            fontWeight: "700",
            color: "#ffffff",
            margin: "0 0 14px 0",
            letterSpacing: "-0.5px",
            lineHeight: "1.18",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}>
            Explore Our Signature Ensembles
          </h2>

          {/* Subtitle */}
          <p style={{
            fontSize: "15px",
            color: "#cce2d3",
            maxWidth: "580px",
            margin: "0 auto 20px auto",
            lineHeight: "1.65",
            fontWeight: "300",
          }}>
            From royal bridal lehengas to bespoke contemporary gowns — each masterpiece crafted for your most celebrated occasions.
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ width: "60px", height: "1px", background: "linear-gradient(90deg, transparent, #c59b27)" }} />
            <GoldDiamond size={7} opacity={0.9} />
            <EmeraldDiamond size={10} opacity={1} />
            <GoldDiamond size={7} opacity={0.9} />
            <div style={{ width: "60px", height: "1px", background: "linear-gradient(270deg, transparent, #c59b27)" }} />
          </div>
        </div>

        {/* GRID — TOP ROW (3 items) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "18px",
          marginBottom: "18px",
        }} className="cat-row-top">
          {topRow.map((cat, i) => (
            <CategoryCard key={cat.id || cat.slug} cat={cat} index={i} large={true} />
          ))}
        </div>

        {/* MIDDLE DIVIDER */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "12px", margin: "4px 0",
        }}>
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, #c59b2750)" }} />
          <GoldDiamond size={6} opacity={0.5} />
          <EmeraldDiamond size={9} opacity={0.6} />
          <GoldDiamond size={6} opacity={0.5} />
          <div style={{ flex: 1, height: "1px", background: "linear-gradient(270deg, transparent, #c59b2750)" }} />
        </div>

        {/* GRID — BOTTOM ROW (3 items) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "18px",
          marginTop: "4px",
        }} className="cat-row-bottom">
          {bottomRow.map((cat, i) => (
            <CategoryCard key={cat.id || cat.slug} cat={cat} index={i + 3} large={false} />
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div style={{
          marginTop: "52px", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FleurDeLis size={18} opacity={0.45} />
            <span style={{ fontSize: "10px", color: "#4a6350", letterSpacing: "3px", textTransform: "uppercase", fontWeight: "700" }}>
              The Complete Atelier
            </span>
            <FleurDeLis size={18} opacity={0.45} />
          </div>

          <Link
            href="/shop"
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              background: "#0d4428",
              color: "#fff",
              fontSize: "11px", fontWeight: "800", letterSpacing: "2.5px",
              textTransform: "uppercase",
              padding: "14px 36px", borderRadius: "3px",
              border: "1px solid #c59b2750",
              boxShadow: "0 4px 20px rgba(13, 68, 40, 0.25)",
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#c59b27";
              el.style.color = "#072818";
              el.style.borderColor = "#f5d77f";
              el.style.boxShadow = "0 8px 32px rgba(197, 155, 39, 0.4)";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#0d4428";
              el.style.color = "#fff";
              el.style.borderColor = "#c59b2750";
              el.style.boxShadow = "0 4px 20px rgba(13, 68, 40, 0.25)";
              el.style.transform = "translateY(0)";
            }}
          >
            <Sparkle size={13} color="#f5d77f" />
            EXPLORE ALL COLLECTIONS
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* RESPONSIVE GRID */}
      <style>{`
        @media (max-width: 900px) {
          .cat-row-top, .cat-row-bottom { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .cat-row-top, .cat-row-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
