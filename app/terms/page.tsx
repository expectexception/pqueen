import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="section-wrapper" style={{ maxWidth: "900px", padding: "60px 6% 100px" }}>
      <div className="section-heading">
        <span className="section-eyebrow">TERMS OF SERVICE</span>
        <h1>Terms & Conditions</h1>
        <p>Guidelines governing the purchase of PQN Party Queen collections.</p>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "36px", boxShadow: "var(--shadow-sm)", lineHeight: "1.8", color: "var(--color-text-muted)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "10px" }}>
          1. Storefront Terms
        </h2>
        <p style={{ marginBottom: "18px" }}>
          By visiting our site or placing an order with PQN Party Queen, you agree to be bound by these terms. We reserve the right to update product offerings, prices, and policies at any time.
        </p>

        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "10px" }}>
          2. Pricing & Currency
        </h2>
        <p style={{ marginBottom: "18px" }}>
          All product prices are stated in Indian Rupees (INR ₹) and include applicable taxes unless otherwise noted.
        </p>

        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "10px" }}>
          3. Intellectual Property
        </h2>
        <p style={{ marginBottom: "20px" }}>
          All designs, trademarks, photography, graphics, and descriptions are the exclusive intellectual property of PQN Party Queen.
        </p>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/" className="btn-secondary">
            RETURN TO HOME
          </Link>
        </div>
      </div>
    </main>
  );
}
