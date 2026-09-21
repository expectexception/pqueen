import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="section-wrapper" style={{ maxWidth: "900px", padding: "60px 6% 100px" }}>
      <div className="section-heading">
        <span className="section-eyebrow">LEGAL & DATA SECURITY</span>
        <h1>Privacy Policy</h1>
        <p>Your privacy and confidential data are rigorously protected.</p>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "36px", boxShadow: "var(--shadow-sm)", lineHeight: "1.8", color: "var(--color-text-muted)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "10px" }}>
          1. Information We Collect
        </h2>
        <p style={{ marginBottom: "18px" }}>
          When you place an order or interact with our services, we collect customer information such as your name, email address, phone number, and delivery address to fulfill and dispatch your orders.
        </p>

        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "10px" }}>
          2. How We Use Your Information
        </h2>
        <p style={{ marginBottom: "18px" }}>
          Your data is used strictly for order fulfillment, shipment tracking updates, and customer support. We never sell, rent, or trade your personal information to third parties.
        </p>

        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "10px" }}>
          3. Security
        </h2>
        <p style={{ marginBottom: "20px" }}>
          All customer data transmissions are protected using industry-standard 256-bit SSL encryption.
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
