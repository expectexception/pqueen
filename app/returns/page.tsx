"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckIcon, ArrowRightIcon, LifeBuoyIcon, ShieldCheckIcon, SearchIcon, MessageSquareIcon } from "@/app/components/Icons";
import TicketDetailModal from "@/app/components/TicketDetailModal";
import { SupportTicket } from "@/lib/tickets";

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState<"file" | "track">("file");

  // File Form State
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    orderNumber: "",
    category: "RETURN_REFUND" as any,
    subject: "",
    description: "",
  });

  const [attachments, setAttachments] = useState<Array<{ url: string; type: "image" | "video"; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any>(null);
  const [error, setError] = useState("");

  // Tracker State
  const [trackQuery, setTrackQuery] = useState("");
  const [searchingTicket, setSearchingTicket] = useState(false);
  const [trackResults, setTrackResults] = useState<SupportTicket[]>([]);
  const [trackError, setTrackError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attachments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit support request.");
      }

      setSubmittedTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || "Unable to submit return request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTrackSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackError("");
    setSearchingTicket(true);
    setTrackResults([]);

    try {
      const query = trackQuery.trim();
      const isEmail = query.includes("@");
      const url = isEmail
        ? `/api/support/tickets?email=${encodeURIComponent(query)}`
        : `/api/support/tickets?ticketNumber=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No ticket found with this reference number.");
      }

      if (data.ticket) {
        setTrackResults([data.ticket]);
        setSelectedTicket(data.ticket);
      } else if (data.tickets && data.tickets.length > 0) {
        setTrackResults(data.tickets);
      } else {
        throw new Error("No complaint records found matching your query.");
      }
    } catch (err: any) {
      setTrackError(err.message || "Could not find ticket.");
    } finally {
      setSearchingTicket(false);
    }
  }

  return (
    <main style={{ minHeight: "calc(100vh - 120px)", background: "var(--bg-main)", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span className="section-eyebrow" style={{ color: "var(--brand-rose)" }}>
            CONCIERGE CARE & ASSISTANCE
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", margin: "6px 0 10px", color: "var(--color-noir)" }}>
            Returns, Exchanges & Complaints
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", maxWidth: "540px", margin: "0 auto" }}>
            We guarantee 100% satisfaction. If your ensemble requires an exchange, refund, or quality review, our atelier concierge is ready to assist.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div
          style={{
            display: "flex",
            background: "#fff",
            borderRadius: "6px",
            border: "1px solid var(--border-medium)",
            padding: "4px",
            marginBottom: "28px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "4px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "file" ? "700" : "500",
              background: activeTab === "file" ? "var(--color-noir)" : "transparent",
              color: activeTab === "file" ? "#fff" : "var(--color-noir)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <MessageSquareIcon size={14} /> File a Return / Complaint
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("track")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "4px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "track" ? "700" : "500",
              background: activeTab === "track" ? "var(--color-noir)" : "transparent",
              color: activeTab === "track" ? "#fff" : "var(--color-noir)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <SearchIcon size={14} /> Track Ticket Status & Updates
          </button>
        </div>

        {/* TAB 1: FILE NEW REQUEST */}
        {activeTab === "file" && (
          <>
            {submittedTicket ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "40px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#15803d",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <CheckIcon size={28} />
                </div>

                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", margin: "0 0 8px" }}>
                  Case Registered Successfully
                </h2>
                <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
                  Your case has been logged under reference number:
                </p>

                <div
                  style={{
                    display: "inline-block",
                    background: "var(--brand-rose-light)",
                    color: "var(--brand-rose)",
                    padding: "12px 28px",
                    borderRadius: "6px",
                    fontSize: "22px",
                    fontFamily: "monospace",
                    fontWeight: "700",
                    marginBottom: "24px",
                    border: "1px solid var(--brand-rose)",
                  }}
                >
                  #{submittedTicket.ticketNumber}
                </div>

                <p style={{ fontSize: "13px", color: "var(--color-text-muted)", maxWidth: "460px", margin: "0 auto 28px", lineHeight: "1.6" }}>
                  Our concierge has initiated case review. A specialist will update your status or reach out on WhatsApp/Email within <strong>2 to 4 business hours</strong>.
                </p>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicket(submittedTicket);
                    }}
                    className="btn-primary"
                    style={{ padding: "10px 20px", fontSize: "12px" }}
                  >
                    View Live Tracker & Updates →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedTicket(null);
                      setForm({
                        customerName: "",
                        customerEmail: "",
                        customerPhone: "",
                        orderNumber: "",
                        category: "RETURN_REFUND",
                        subject: "",
                        description: "",
                      });
                      setAttachments([]);
                    }}
                    className="btn-secondary"
                    style={{ padding: "10px 20px", fontSize: "12px" }}
                  >
                    Submit Another Case
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  padding: "36px",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                {/* Step 1: Customer Contact */}
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "0 0 16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                  1. Your Contact & Order Information
                </h2>

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Priyanshi Sharma"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="e.g. name@example.com"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: "12px" }}>
                  <div className="form-group">
                    <label>WhatsApp / Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Order Number (If applicable)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. PQN-1787253960998"
                      value={form.orderNumber}
                      onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Step 2: Reason & Details */}
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "28px 0 16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                  2. Nature of Request
                </h2>

                <div className="form-group">
                  <label>Reason / Category *</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="RETURN_REFUND">Return &amp; Full Refund (Strict 5-Day Delivery Window)</option>
                    <option value="SIZE_EXCHANGE">Size Exchange (Strict 5-Day Delivery Window)</option>
                    <option value="DAMAGED_DEFECTIVE">Damaged or Defective Item Received</option>
                    <option value="SHIPPING_DELAY">Delivery Delay / Shipping Tracking Query</option>
                    <option value="QUALITY_CONCERN">Quality Concern / Fabric Inquiry</option>
                    <option value="GENERAL_INQUIRY">General Customer Support</option>
                  </select>
                  <p style={{ fontSize: "11.5px", color: "#0d4428", margin: "6px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                    <ShieldCheckIcon size={13} /> <strong>Strict 5-Day Return Policy:</strong> Returns &amp; size exchanges are valid for 5 days from the exact date &amp; time of doorstep delivery.
                  </p>
                </div>

                <div className="form-group" style={{ marginTop: "12px" }}>
                  <label>Subject / Headline *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Size exchange for Embroidered Lehenga (Need Size M)"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: "12px" }}>
                  <label>Detailed Description *</label>
                  <textarea
                    rows={4}
                    required
                    className="form-input"
                    style={{ height: "auto", padding: "12px", lineHeight: "1.5" }}
                    placeholder="Please explain the issue or your preferred resolution (e.g. refund mode, new size preference, or courier details)..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* Step 3: Photo & Video Evidence Upload */}
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "28px 0 16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
                  3. Attach Photos or Video Evidence (Optional)
                </h2>
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
                  Upload unboxing videos, defect photos, or fitting try-on media (MP4, WEBM, JPG, PNG up to 25MB).
                </p>

                <div style={{ marginBottom: "16px" }}>
                  <input
                    id="complaint-media-input"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;

                      if (attachments.length + files.length > 5) {
                        setError("You can upload a maximum of 5 evidence files.");
                        return;
                      }

                      Array.from(files).forEach((file) => {
                        if (file.size > 25 * 1024 * 1024) {
                          setError(`File ${file.name} exceeds the 25 MB limit.`);
                          return;
                        }

                        const isVideo = file.type.startsWith("video/");
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const dataUrl = event.target?.result as string;
                          setAttachments((prev) => [
                            ...prev,
                            {
                              url: dataUrl,
                              type: isVideo ? "video" : "image",
                              name: file.name,
                            },
                          ]);
                        };
                        reader.readAsDataURL(file);
                      });
                      setError("");
                    }}
                  />

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          width: "120px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "1px solid var(--border-medium)",
                          background: "#000",
                        }}
                      >
                        {att.type === "video" ? (
                          <div style={{ position: "relative", width: "100%", height: "90px", background: "#1c1917", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <video src={att.url} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            <span style={{ position: "absolute", bottom: "4px", left: "4px", background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "9px", padding: "1px 4px", borderRadius: "2px" }}>
                              VIDEO
                            </span>
                          </div>
                        ) : (
                          <img src={att.url} alt={att.name || "Evidence"} style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                        )}

                        <div style={{ background: "#fafaf9", padding: "4px 6px", fontSize: "10px", color: "var(--color-noir)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.name || `File ${idx + 1}`}
                        </div>

                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          style={{
                            position: "absolute",
                            top: "3px",
                            right: "3px",
                            background: "rgba(0,0,0,0.8)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {attachments.length < 5 && (
                      <button
                        type="button"
                        onClick={() => document.getElementById("complaint-media-input")?.click()}
                        style={{
                          width: "120px",
                          height: "110px",
                          borderRadius: "6px",
                          border: "1.5px dashed var(--border-medium)",
                          background: "#fafaf9",
                          color: "var(--color-text-muted)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          cursor: "pointer",
                          gap: "4px",
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>+</span>
                        <span style={{ fontWeight: "600" }}>Upload Video/Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "4px", fontSize: "13px", marginTop: "16px" }}>
                    {error}
                  </div>
                )}

                <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                    style={{ padding: "12px 28px", fontSize: "13px" }}
                  >
                    {submitting ? "SUBMITTING DOSSIER..." : "SUBMIT TICKET TO CONCIERGE"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* TAB 2: TRACK EXISTING COMPLAINT */}
        {activeTab === "track" && (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "36px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: "0 0 8px" }}>
              Lookup Ticket Status & Atelier Updates
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "24px" }}>
              Enter your Ticket Number (e.g. <strong style={{ color: "var(--brand-rose)" }}>TKT-84920</strong>) or your account Email to check live resolution progress, atelier tailoring notes, and refund details.
            </p>

            <form onSubmit={handleTrackSearch} style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <SearchIcon size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter Ticket # (e.g. TKT-84920) or your Email"
                  className="form-input"
                  style={{ paddingLeft: "42px", height: "44px" }}
                />
              </div>
              <button
                type="submit"
                disabled={searchingTicket}
                className="btn-primary"
                style={{ padding: "0 24px", height: "44px", fontSize: "12px", letterSpacing: "1px" }}
              >
                {searchingTicket ? "SEARCHING..." : "TRACK CASE"}
              </button>
            </form>

            {trackError && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "4px", fontSize: "13px", marginBottom: "20px" }}>
                {trackError}
              </div>
            )}

            {trackResults.length > 0 && (
              <div>
                <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px", color: "var(--color-noir)" }}>
                  Found Cases ({trackResults.length}):
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {trackResults.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        background: "#fafaf9",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "6px",
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <strong style={{ color: "var(--brand-rose)", fontSize: "14px" }}>#{t.ticketNumber}</strong>
                          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                            • Filed on {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-noir)" }}>
                          {t.subject}
                        </div>
                        {t.adminNotes && (
                          <div style={{ fontSize: "12px", color: "#15803d", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <MessageSquareIcon size={12} /> <strong>Update:</strong> {t.adminNotes}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: "var(--brand-rose-light)",
                            color: "var(--brand-rose)",
                            textTransform: "uppercase",
                          }}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className="btn-secondary"
                          style={{ padding: "6px 14px", fontSize: "11px" }}
                        >
                          View Full Dossier →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TICKET DETAIL DOSSIER MODAL */}
        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            isOpen={Boolean(selectedTicket)}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </div>
    </main>
  );
}
