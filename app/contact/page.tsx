"use client";

import React, { useState } from "react";
import { useToast } from "@/app/context/ToastContext";
import { ShieldCheckIcon, TruckIcon } from "@/app/components/Icons";

export default function ContactPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    showToast("Message received! Our stylist concierge will reach out within 24 hours.", { type: "success" });
  }

  return (
    <main className="section-wrapper" style={{ maxWidth: "1000px", padding: "60px 6% 100px" }}>
      <div className="section-heading">
        <span className="section-eyebrow">VIP CONCIERGE</span>
        <h1>Contact Us</h1>
        <p>Our dedicated styling advisors and support specialists are here for you.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "40px", alignItems: "start" }}>
        {/* Contact Info Card */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "32px", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", marginBottom: "16px" }}>Atelier Support</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: "1.7", marginBottom: "24px" }}>
            Reach out for size consultations, custom styling inquiries, or order delivery updates.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
            <div>
              <strong style={{ display: "block", color: "var(--brand-rose)", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
                Concierge Email
              </strong>
              <span>support@pqnpartyqueen.com</span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--brand-rose)", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
                WhatsApp Concierge
              </strong>
              <span>+91 98765 43210 (10 AM – 7 PM IST)</span>
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--brand-rose)", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
                Headquarters
              </strong>
              <span>PQN Fashion Atelier, High Street Couture, Mumbai, India</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "32px", boxShadow: "var(--shadow-sm)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#dcfce7", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                ✓
              </div>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", marginBottom: "8px" }}>Thank You!</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
                Your message has been sent to our VIP Concierge team. We will be in touch shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", marginBottom: "20px" }}>Send a Message</h2>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>How Can We Help? *</label>
                <textarea
                  required
                  rows={4}
                  className="form-input"
                  style={{ height: "auto", padding: "12px", resize: "vertical" }}
                  placeholder="Inquire about sizing, customized fits, or an existing order..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "14px" }}>
                SEND MESSAGE
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
