import React from "react";
import Link from "next/link";

export default function FAQPage() {
  const faqs = [
    {
      q: "How do I know which size will fit me best?",
      a: "Each product features our tailored size chart spanning Bust, Waist, and Hip measurements. If you fall between sizes or need custom alterations, message our stylist on WhatsApp before ordering.",
    },
    {
      q: "Is Cash on Delivery (COD) available?",
      a: "Yes! We support Cash on Delivery across all serviceable PIN codes in India. You may pay with cash or via digital UPI QR code upon arrival.",
    },
    {
      q: "How long does delivery take?",
      a: "Orders are dispatched within 24-48 business hours. Delivery typically takes 3-5 business days for metropolitan cities and 5-7 days for other regions.",
    },
    {
      q: "What is your exchange policy?",
      a: "We offer a 7-day hassle-free size exchange guarantee. Garments must be unworn and in original condition with tags intact.",
    },
    {
      q: "Can I cancel or modify my order?",
      a: "You can modify or cancel your order within 12 hours of placement by emailing support@pqnpartyqueen.com or messaging our WhatsApp concierge.",
    },
  ];

  return (
    <main className="section-wrapper" style={{ maxWidth: "900px", padding: "60px 6% 100px" }}>
      <div className="section-heading">
        <span className="section-eyebrow">HELP CENTER</span>
        <h1>Frequently Asked Questions</h1>
        <p>Answers to common questions regarding shopping, delivery, and sizing.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "24px 28px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", color: "var(--color-noir)", marginBottom: "8px" }}>
              {faq.q}
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "16px" }}>Still have questions?</p>
        <Link href="/contact" className="btn-primary">
          TALK TO OUR STYLIST TEAM
        </Link>
      </div>
    </main>
  );
}
