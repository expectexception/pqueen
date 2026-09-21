"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { appConfig } from "@/lib/config";
import { SupportTicket, TicketCategory, TicketPriority } from "@/lib/tickets";
import TicketDetailModal from "@/app/components/TicketDetailModal";
import {
  LifeBuoyIcon,
  CheckIcon,
  SearchIcon,
  MessageSquareIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  PlusIcon,
} from "@/app/components/Icons";

function HelpdeskContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"file" | "track" | "concierge">("file");

  // Ticket Form State
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    orderNumber: "",
    category: "RETURN_REFUND" as TicketCategory,
    priority: "MEDIUM" as TicketPriority,
    subject: "",
    description: "",
  });

  const [mediaUrl, setMediaUrl] = useState("");
  const [attachments, setAttachments] = useState<Array<{ url: string; type: "image" | "video"; name?: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);
  const [formError, setFormError] = useState("");

  // Tracking State
  const [trackQuery, setTrackQuery] = useState("");
  const [searchingTicket, setSearchingTicket] = useState(false);
  const [trackResults, setTrackResults] = useState<SupportTicket[]>([]);
  const [trackError, setTrackError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Pre-fill from query params or logged-in user
  useEffect(() => {
    const orderFromQuery = searchParams.get("orderNumber") || searchParams.get("orderId") || "";
    const tabFromQuery = searchParams.get("tab");
    const ticketFromQuery = searchParams.get("ticketNumber");

    if (tabFromQuery === "track" || ticketFromQuery) {
      setActiveTab("track");
      if (ticketFromQuery) {
        setTrackQuery(ticketFromQuery);
        fetchTicketByRef(ticketFromQuery);
      }
    } else if (tabFromQuery === "concierge") {
      setActiveTab("concierge");
    }

    if (orderFromQuery) {
      setForm((prev) => ({
        ...prev,
        orderNumber: orderFromQuery,
        subject: prev.subject || `Inquiry regarding order #${orderFromQuery}`,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name || "",
        customerEmail: prev.customerEmail || user.email || "",
        customerPhone: prev.customerPhone || user.phone || "",
      }));
      if (!trackQuery && user.email) {
        setTrackQuery(user.email);
      }
    }
  }, [user]);

  async function fetchTicketByRef(ref: string) {
    if (!ref.trim()) return;
    setSearchingTicket(true);
    setTrackError("");
    try {
      const isEmail = ref.includes("@");
      const url = isEmail
        ? `/api/support/tickets?email=${encodeURIComponent(ref.trim())}`
        : `/api/support/tickets?ticketNumber=${encodeURIComponent(ref.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No complaint record found matching your query.");
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
      setTrackError(err.message || "Failed to search ticket.");
    } finally {
      setSearchingTicket(false);
    }
  }

  function handleAddAttachment() {
    if (!mediaUrl.trim()) return;
    const isVideo = mediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) !== null;
    setAttachments((prev) => [
      ...prev,
      {
        url: mediaUrl.trim(),
        type: isVideo ? "video" : "image",
        name: `Evidence Attachment #${prev.length + 1}`,
      },
    ]);
    setMediaUrl("");
  }

  function handleRemoveAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitTicket(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          orderNumber: form.orderNumber,
          category: form.category,
          priority: form.priority,
          subject: form.subject,
          description: form.description,
          attachments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit support ticket.");
      }

      setSubmittedTicket(data.ticket);
    } catch (err: any) {
      setFormError(err.message || "Unable to register your support ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await fetchTicketByRef(trackQuery);
  }

  const cleanPhone = (appConfig.brand.whatsappNumber || "9220350565").replace(/[^0-9]/g, "");

  return (
    <main style={{ minHeight: "calc(100vh - 120px)", background: "var(--bg-main)", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        
        {/* HEADER / HERO */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <span className="section-eyebrow" style={{ color: "var(--brand-rose)" }}>
            PQN ATELIER CLIENT CONCIERGE
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", margin: "8px 0 12px", color: "var(--color-noir)" }}>
            Customer Helpdesk &amp; Support Portal
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
            Experience dedicated white-glove assistance. File alteration requests, exchange tickets, shipment inquiries, or connect directly with our master stylists.
          </p>
        </div>

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid var(--border-medium)",
            padding: "6px",
            marginBottom: "32px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            style={{
              padding: "12px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "file" ? "700" : "500",
              background: activeTab === "file" ? "#072818" : "transparent",
              color: activeTab === "file" ? "#f5d77f" : "var(--color-noir)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <MessageSquareIcon size={16} /> File New Ticket
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("track")}
            style={{
              padding: "12px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "track" ? "700" : "500",
              background: activeTab === "track" ? "#072818" : "transparent",
              color: activeTab === "track" ? "#f5d77f" : "var(--color-noir)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <SearchIcon size={16} /> Track Resolution
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("concierge")}
            style={{
              padding: "12px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: activeTab === "concierge" ? "700" : "500",
              background: activeTab === "concierge" ? "#072818" : "transparent",
              color: activeTab === "concierge" ? "#f5d77f" : "var(--color-noir)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <SparklesIcon size={16} /> VIP Concierge
          </button>
        </div>

        {/* TAB 1: FILE TICKET */}
        {activeTab === "file" && (
          <div>
            {submittedTicket ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "44px 32px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <CheckIcon size={32} />
                </div>

                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", margin: "0 0 8px", color: "var(--color-noir)" }}>
                  Support Ticket Filed Successfully
                </h2>
                <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
                  Your case has been logged under priority reference:
                </p>

                <div
                  style={{
                    display: "inline-block",
                    background: "#072818",
                    color: "#f5d77f",
                    padding: "12px 32px",
                    borderRadius: "6px",
                    fontSize: "22px",
                    fontFamily: "monospace",
                    fontWeight: "700",
                    marginBottom: "24px",
                    letterSpacing: "1px",
                    border: "1px solid #c59b27",
                  }}
                >
                  #{submittedTicket.ticketNumber}
                </div>

                <p style={{ fontSize: "13.5px", color: "var(--color-text-muted)", maxWidth: "520px", margin: "0 auto 32px", lineHeight: "1.6" }}>
                  Our concierge has initiated your case review. An atelier specialist will provide a live resolution update or reach out on WhatsApp/Email within <strong>2 to 4 business hours</strong>.
                </p>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicket(submittedTicket);
                    }}
                    className="btn btn-primary"
                    style={{ padding: "11px 24px", fontSize: "13px" }}
                  >
                    View Ticket Details &amp; Status →
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedTicket(null);
                      setForm({
                        customerName: user?.name || "",
                        customerEmail: user?.email || "",
                        customerPhone: user?.phone || "",
                        orderNumber: "",
                        category: "RETURN_REFUND",
                        priority: "MEDIUM",
                        subject: "",
                        description: "",
                      });
                      setAttachments([]);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "11px 20px", fontSize: "13px" }}
                  >
                    File Another Ticket
                  </button>

                  <Link
                    href="/account"
                    className="btn btn-outline"
                    style={{ padding: "11px 20px", fontSize: "13px" }}
                  >
                    Return to My Account
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitTicket}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "36px",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                {formError && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      padding: "12px 16px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      marginBottom: "24px",
                    }}
                  >
                    {formError}
                  </div>
                )}

                {/* Section 1: Customer Info */}
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", margin: "0 0 16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-noir)" }}>
                    1. Contact &amp; Order Identification
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "12px", fontWeight: "600" }}>Full Name *</label>
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
                      <label style={{ fontSize: "12px", fontWeight: "600" }}>Email Address *</label>
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "14px" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "12px", fontWeight: "600" }}>WhatsApp / Mobile Contact</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="e.g. 9876543210"
                        value={form.customerPhone}
                        onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "12px", fontWeight: "600" }}>Order Number (If applicable)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. PQN-1787253960998"
                        value={form.orderNumber}
                        onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Ticket Classification */}
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", margin: "0 0 16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-noir)" }}>
                    2. Nature of Request &amp; Priority
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                    <div className="form-group">
                      <label style={{ fontSize: "12px", fontWeight: "600" }}>Support Category *</label>
                      <select
                        className="form-input"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}
                      >
                        <option value="RETURN_REFUND">Return &amp; Full Refund (Original Payment / Bank)</option>
                        <option value="SIZE_EXCHANGE">Size Exchange &amp; Fitting Adjustment</option>
                        <option value="DAMAGED_DEFECTIVE">Transit Damage or Defective Item Received</option>
                        <option value="SHIPPING_DELAY">Delivery Status &amp; Priority Expediting</option>
                        <option value="QUALITY_CONCERN">Fabric Quality or Embroidery Inquiry</option>
                        <option value="GENERAL_INQUIRY">General Concierge Support &amp; Styling</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: "12px", fontWeight: "600" }}>Urgency Level</label>
                      <select
                        className="form-input"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
                      >
                        <option value="LOW">Low (Standard Inquiry)</option>
                        <option value="MEDIUM">Medium (General Support)</option>
                        <option value="HIGH">High (Active Order / Exchange)</option>
                        <option value="URGENT">Urgent (Event Within 48 Hours)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Subject & Description */}
                <div style={{ marginBottom: "28px" }}>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", margin: "0 0 16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-noir)" }}>
                    3. Case Description &amp; Evidence
                  </h3>

                  <div className="form-group" style={{ marginBottom: "14px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600" }}>Subject / Brief Headline *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Size exchange for Embroidered Lehenga to size M"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "600" }}>Detailed Explanation *</label>
                    <textarea
                      required
                      rows={5}
                      className="form-input"
                      placeholder="Please explain the issue or requested resolution in detail. If requesting a size exchange, mention your preferred size and event date."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      style={{ resize: "vertical" }}
                    />
                  </div>

                  {/* Attachment URL Input */}
                  <div className="form-group">
                    <label style={{ fontSize: "12px", fontWeight: "600" }}>Attach Photo / Video Evidence URL (Optional)</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="e.g. https://images.unsplash.com/... or cloud link"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={handleAddAttachment}
                        disabled={!mediaUrl.trim()}
                        className="btn btn-secondary"
                        style={{ padding: "8px 16px", fontSize: "12px", whiteSpace: "nowrap" }}
                      >
                        <PlusIcon size={14} /> Add Media
                      </button>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
                      Paste a direct image or video link for faster processing of damage/fitting claims.
                    </span>
                  </div>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 12px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          <span>{att.name} ({att.type})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "bold" }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                  <Link href="/account" style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                    ← Back to Account
                  </Link>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: "12px 32px", fontSize: "13px", fontWeight: "600" }}
                  >
                    {submitting ? "Registering Ticket..." : "Submit Support Ticket →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: TRACK RESOLUTION */}
        {activeTab === "track" && (
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "36px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: "0 0 8px", color: "var(--color-noir)" }}>
              Track Support Ticket Resolution
            </h2>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "24px" }}>
              Search using your unique Ticket Reference (e.g. <code>TKT-84920</code>) or the email address used during filing.
            </p>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Enter Ticket # (e.g. TKT-84920) or your registered Email..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                disabled={searchingTicket}
                className="btn btn-primary"
                style={{ padding: "10px 24px", fontSize: "13px", whiteSpace: "nowrap" }}
              >
                {searchingTicket ? "Searching..." : "Lookup Ticket"}
              </button>
            </form>

            {trackError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "14px 18px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                {trackError}
              </div>
            )}

            {trackResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Matching Support Tickets ({trackResults.length})
                </h3>

                {trackResults.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    style={{
                      background: "#fafafa",
                      border: "1px solid var(--border-medium)",
                      borderRadius: "6px",
                      padding: "18px 22px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#c59b27";
                      e.currentTarget.style.background = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-medium)";
                      e.currentTarget.style.background = "#fafafa";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#072818", fontSize: "13px" }}>
                          #{t.ticketNumber}
                        </span>
                        <strong style={{ fontSize: "14px" }}>{t.subject}</strong>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background:
                              t.status === "RESOLVED" || t.status === "REFUND_PROCESSED"
                                ? "#ecfdf5"
                                : t.status === "UNDER_REVIEW" || t.status === "EXCHANGE_SHIPPED"
                                ? "#eff6ff"
                                : "#fef3c7",
                            color:
                              t.status === "RESOLVED" || t.status === "REFUND_PROCESSED"
                                ? "#065f46"
                                : t.status === "UNDER_REVIEW" || t.status === "EXCHANGE_SHIPPED"
                                ? "#1e40af"
                                : "#92400e",
                          }}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        Category: {t.category.replace(/_/g, " ")} • Created: {new Date(t.createdAt).toLocaleDateString()}
                        {t.orderNumber && ` • Order #${t.orderNumber}`}
                      </span>
                    </div>

                    <span style={{ fontSize: "12px", color: "var(--brand-rose)", fontWeight: "600" }}>
                      View Live Tracker →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VIP CONCIERGE & DIRECT CONTACT */}
        {activeTab === "concierge" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* VIP Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
                borderRadius: "10px",
                padding: "36px",
                color: "#fff",
                border: "1px solid #c59b27",
                boxShadow: "0 10px 25px rgba(7,40,24,0.15)",
              }}
            >
              <span style={{ fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#f5d77f", fontWeight: "700" }}>
                INSTANT VIP ACCESS
              </span>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", margin: "8px 0 12px", color: "#fff" }}>
                Direct WhatsApp Concierge &amp; Styling Hotline
              </h2>
              <p style={{ color: "#d1d5db", fontSize: "14px", lineHeight: "1.6", maxWidth: "560px", marginBottom: "28px" }}>
                Need immediate fitting advice or urgent delivery expediting for an upcoming event? Connect directly with our lead styling concierge in real time.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                <a
                  href={`https://wa.me/91${cleanPhone}?text=Hello%20PQN%20Concierge,%20I%20need%20urgent%20assistance%20regarding%20my%20order.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "rgba(245, 215, 127, 0.15)",
                    border: "1px solid #c59b27",
                    borderRadius: "6px",
                    padding: "16px",
                    color: "#f5d77f",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "background 0.15s ease",
                  }}
                >
                  <MessageSquareIcon size={18} /> Chat on WhatsApp
                </a>

                <a
                  href={`tel:+91${cleanPhone}`}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "6px",
                    padding: "16px",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <PhoneIcon size={18} /> Call +91 {cleanPhone}
                </a>

                <a
                  href={`mailto:${appConfig.brand.supportEmail || "support@pqnpartyqueen.com"}`}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "6px",
                    padding: "16px",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <MailIcon size={18} /> {appConfig.brand.supportEmail || "support@pqnpartyqueen.com"}
                </a>
              </div>
            </div>

            {/* Operating Hours & Policy Promises */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <ClockIcon size={20} className="text-emerald-800" />
                  <h3 style={{ fontSize: "16px", margin: 0, fontFamily: "var(--font-serif)" }}>Desk Hours &amp; Response SLA</h3>
                </div>
                <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--color-text-muted)", lineHeight: "1.8", margin: 0 }}>
                  <li><strong>Monday – Saturday:</strong> 10:00 AM – 8:00 PM IST</li>
                  <li><strong>Sunday:</strong> 11:00 AM – 5:00 PM IST</li>
                  <li><strong>Ticket Response Time:</strong> Within 2 to 4 business hours</li>
                  <li><strong>Emergency Wedding Hotline:</strong> Available 24/7 for bridal orders</li>
                </ul>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <ShieldCheckIcon size={20} className="text-emerald-800" />
                  <h3 style={{ fontSize: "16px", margin: 0, fontFamily: "var(--font-serif)" }}>PQN Client Promises</h3>
                </div>
                <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--color-text-muted)", lineHeight: "1.8", margin: 0 }}>
                  <li><strong>7-Day Easy Exchange:</strong> Complimentary size adjustments</li>
                  <li><strong>Doorstep Reverse Pickup:</strong> Hassle-free courier pickup</li>
                  <li><strong>Instant Refund Dispatch:</strong> Processed within 24 hours of inspection</li>
                  <li><strong>100% Handcrafted Authenticity:</strong> Direct from master artisans</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* TICKET DETAIL MODAL */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
      />
    </main>
  );
}

export default function HelpdeskPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>Loading Helpdesk Portal...</div>}>
      <HelpdeskContent />
    </Suspense>
  );
}
