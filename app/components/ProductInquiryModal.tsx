"use client";

import React, { useState, useRef } from "react";
import { CloseIcon, CheckIcon, SparklesIcon } from "@/app/components/Icons";
import { useToast } from "@/app/context/ToastContext";

type ProductInquiryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id?: string;
    name: string;
    image?: string;
    price?: number | string;
  };
};

export default function ProductInquiryModal({
  isOpen,
  onClose,
  product,
}: ProductInquiryModalProps) {
  const { showToast } = useToast();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    category: "SIZING_FIT" as any,
    subject: `Customization Inquiry for ${product.name}`,
    message: "",
  });

  const [attachments, setAttachments] = useState<Array<{ url: string; type: "image" | "video"; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<any>(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      setError("You can attach up to 5 reference photos or videos.");
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        setError(`File ${file.name} is larger than 25MB.`);
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.customerName.trim() || !form.customerEmail.trim() || !form.message.trim()) {
      setError("Please fill in your Name, Email, and Inquiry details.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          ...form,
          attachments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry.");
      }

      setSubmittedInquiry(data.inquiry);
      showToast("Inquiry submitted! Our master stylist will connect with you.", { type: "success" });
    } catch (err: any) {
      setError(err.message || "Failed to submit inquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(10, 10, 10, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          width: "100%",
          maxWidth: "580px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fafaf9",
          }}
        >
          <div>
            <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "1.2px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
              HAUTE COUTURE CONCIERGE
            </span>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "16px", margin: 0, color: "var(--color-noir)" }}>
              Product Inquiry & Bespoke Fitting
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#78716c", cursor: "pointer" }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div style={{ padding: "20px" }}>
          {submittedInquiry ? (
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#15803d",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <CheckIcon size={26} />
              </div>
              <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: "0 0 6px" }}>
                Inquiry Received
              </h4>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 16px" }}>
                Reference: <strong style={{ color: "var(--brand-rose)" }}>#{submittedInquiry.inquiryNumber}</strong>
              </p>
              <p style={{ fontSize: "13px", color: "var(--color-text-main)", lineHeight: 1.6, maxWidth: "420px", margin: "0 auto 24px" }}>
                Our bridal & tailoring stylist will review your request and connect with you via WhatsApp or Email within 2 business hours.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="btn-primary"
                style={{ padding: "10px 24px", fontSize: "12px" }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Product mini card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  background: "#fafaf9",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt=""
                    style={{ width: "42px", height: "54px", objectFit: "cover", borderRadius: "3px" }}
                  />
                )}
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--color-noir)", display: "block" }}>
                    {product.name}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--brand-rose)", fontWeight: "600" }}>
                    Bespoke Atelier Assistance
                  </span>
                </div>
              </div>

              {error && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "8px 12px", borderRadius: "4px", fontSize: "12px" }}>
                  {error}
                </div>
              )}

              {/* Inquiry Category */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                  Inquiry Topic *
                </label>
                <select
                  className="form-input"
                  style={{ width: "100%", height: "38px", fontSize: "12px" }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="SIZING_FIT">Sizing & Custom Fitting Alterations</option>
                  <option value="CUSTOM_DESIGN">Custom Neckline / Sleeve / Flare Design</option>
                  <option value="FABRIC_COLOR">Fabric / Color Dye Customization</option>
                  <option value="BULK_BRIDAL">Bridal Trousseau / Bulk Order</option>
                  <option value="DELIVERY_TIMELINE">Express Delivery / Event Rush</option>
                  <option value="GENERAL">General Styling Inquiry</option>
                </select>
              </div>

              {/* Contact Fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="review-author-grid">
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Radhika Mehra"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    style={{ width: "100%", height: "38px", fontSize: "12px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="name@example.com"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    style={{ width: "100%", height: "38px", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                  WhatsApp / Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9811223344"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  style={{ width: "100%", height: "38px", fontSize: "12px" }}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                  Your Inquiry / Custom Requirements *
                </label>
                <textarea
                  rows={3}
                  required
                  className="form-input"
                  placeholder="Describe your measurements, event date, custom color preference, or questions..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px", fontSize: "12px", height: "auto" }}
                />
              </div>

              {/* Media / Video Reference Upload */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                    Attach Reference Photos or Videos (Optional • Max 5)
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {attachments.length}/5
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "60px",
                        height: "70px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid var(--border-medium)",
                        background: "#000",
                      }}
                    >
                      {att.type === "video" ? (
                        <div style={{ width: "100%", height: "100%", background: "#262626", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px" }}>
                          VIDEO
                        </div>
                      ) : (
                        <img src={att.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "rgba(0,0,0,0.8)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          fontSize: "9px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {attachments.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: "60px",
                        height: "70px",
                        borderRadius: "4px",
                        border: "1.5px dashed var(--border-medium)",
                        background: "#fafaf9",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <span>+</span>
                      <span>Attach</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-medium)",
                    background: "#fff",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ padding: "8px 20px", fontSize: "12px", letterSpacing: "1px" }}
                >
                  {submitting ? "SENDING..." : "SUBMIT INQUIRY"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
