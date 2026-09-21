import React from "react";
import Link from "next/link";
import { SparklesIcon, ArrowRightIcon, ShieldCheckIcon } from "@/app/components/Icons";

export default function AboutPage() {
  return (
    <main className="section-wrapper" style={{ maxWidth: "1000px", padding: "60px 6% 100px" }}>
      <div className="section-heading">
        <span className="section-eyebrow">OUR HERITAGE & ATELIER</span>
        <h1>About PQN Party Queen</h1>
        <p>Redefining luxury Indian bridal and party couture since inception.</p>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "40px", boxShadow: "var(--shadow-sm)", lineHeight: "1.8", color: "var(--color-text-muted)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--color-noir)", fontSize: "24px", marginBottom: "16px" }}>
          Crafted For Unforgettable Moments
        </h2>
        <p style={{ marginBottom: "20px" }}>
          At <strong>PQN Party Queen</strong>, we believe every celebration deserves a masterpiece. Born out of a deep reverence for traditional Indian craftsmanship and contemporary silhouette aesthetics, our collections span regal bridal lehengas, majestic anarkalis, modern pre-draped sarees, and statement evening gowns.
        </p>
        <p style={{ marginBottom: "24px" }}>
          Every piece in our atelier is meticulously designed with hand-picked fabrics—from luminous georgettes and pure raw silks to delicate organzas—adorned with bespoke zari, sequin, and thread embroideries that shimmer under celebratory lights.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", margin: "32px 0", padding: "24px 0", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--brand-rose-light)", color: "var(--brand-rose)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheckIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--color-noir)", marginBottom: "4px" }}>Artisanal Precision</h3>
              <p style={{ fontSize: "13px", margin: 0 }}>Over 100+ hours of dedicated artisan handcraft per couture silhouette.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--brand-rose-light)", color: "var(--brand-rose)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <SparklesIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", color: "var(--color-noir)", marginBottom: "4px" }}>Timeless Grace</h3>
              <p style={{ fontSize: "13px", margin: 0 }}>Flattering fits designed to empower every woman as the queen of the night.</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link href="/shop" className="btn-primary">
            EXPLORE THE COLLECTION <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
