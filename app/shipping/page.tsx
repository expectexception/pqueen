import React from "react";
import Link from "next/link";
import { TruckIcon, ShieldCheckIcon, PackageIcon } from "@/app/components/Icons";

export default function ShippingPage() {
  return (
    <main className="section-wrapper" style={{ maxWidth: "900px", padding: "60px 6% 100px" }}>
      <div className="section-heading">
        <span className="section-eyebrow">DOMESTIC & INTERNATIONAL</span>
        <h1>Shipping & Delivery Policy</h1>
        <p>Reliable, express, and fully insured delivery across India and worldwide.</p>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "36px", boxShadow: "var(--shadow-sm)", lineHeight: "1.8", color: "var(--color-text-muted)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "12px" }}>
          1. Free Express Shipping Across India
        </h2>
        <p style={{ marginBottom: "20px" }}>
          We proudly offer <strong>100% complimentary express shipping</strong> on all orders within India. No minimum purchase requirement is needed.
        </p>

        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "12px" }}>
          2. Order Processing & Timeline
        </h2>
        <p style={{ marginBottom: "20px" }}>
          • <strong>Ready-to-Ship Styles:</strong> Dispatched from our Mumbai atelier within 24 to 48 business hours.<br />
          • <strong>Delivery Window:</strong> 3 to 5 business days for major Indian metros; 5 to 7 days for regional towns.<br />
          • <strong>Tracking:</strong> As soon as your package is handed over to our courier partner (Bluedart / Delhivery / DTDC), you will receive an SMS and WhatsApp update with your real-time tracking link.
        </p>

        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--color-noir)", marginBottom: "12px" }}>
          3. Cash on Delivery (COD)
        </h2>
        <p style={{ marginBottom: "20px" }}>
          Cash on Delivery is available across eligible pin codes. Please ensure you keep the exact order amount ready at delivery. Digital UPI QR payment on delivery is also accepted by courier agents.
        </p>

        <div style={{ textAlign: "center", marginTop: "32px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
          <Link href="/shop" className="btn-primary">
            RETURN TO SHOPPING
          </Link>
        </div>
      </div>
    </main>
  );
}
