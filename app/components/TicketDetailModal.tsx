"use client";

import React from "react";
import { CloseIcon, CheckIcon, ShieldCheckIcon, LifeBuoyIcon, WhatsAppIcon } from "@/app/components/Icons";
import { SupportTicket, TicketStatus, TicketCategory } from "@/lib/tickets";

type TicketDetailModalProps = {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
}: TicketDetailModalProps) {
  if (!isOpen || !ticket) return null;

  function getStepIndex(st: TicketStatus): number {
    switch (st) {
      case "OPEN":
        return 1;
      case "UNDER_REVIEW":
        return 2;
      case "REFUND_APPROVED":
      case "EXCHANGE_SHIPPED":
        return 3;
      case "REFUND_PROCESSED":
        return 4;
      case "RESOLVED":
      case "CLOSED":
        return 5;
      default:
        return 1;
    }
  }

  const currentStep = getStepIndex(ticket.status);

  const steps = [
    { num: 1, label: "Registered", desc: "Complaint logged" },
    { num: 2, label: "Under Review", desc: "Concierge reviewing" },
    { num: 3, label: "Atelier Action", desc: "Approved / Dispatched" },
    { num: 4, label: "Processing", desc: "Refund / Exchange" },
    { num: 5, label: "Resolved", desc: "Case completed" },
  ];

  function formatCategory(cat: TicketCategory): string {
    switch (cat) {
      case "RETURN_REFUND":
        return "Return & Full Refund";
      case "SIZE_EXCHANGE":
        return "Size & Fitting Exchange";
      case "DAMAGED_DEFECTIVE":
        return "Damaged / Defect Claim";
      case "SHIPPING_DELAY":
        return "Shipping Tracking Query";
      case "QUALITY_CONCERN":
        return "Fabric Quality Concern";
      default:
        return "General Support";
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
          maxWidth: "640px",
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
            padding: "16px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#fafaf9",
          }}
        >
          <div>
            <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.2px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
              COMPLAINT CASE DOSSIER • #{ticket.ticketNumber}
            </span>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", margin: 0, color: "var(--color-noir)" }}>
              {ticket.subject}
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

        {/* MODAL BODY */}
        <div style={{ padding: "24px" }}>
          {/* VISUAL PROGRESS TRACKER STEPPER */}
          <div style={{ marginBottom: "28px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-text-muted)", display: "block", marginBottom: "12px" }}>
              Live Resolution Progress
            </span>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
              {/* Connecting line */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "20px",
                  right: "20px",
                  height: "3px",
                  background: "#e7e5e4",
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "20px",
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                  height: "3px",
                  background: "var(--brand-rose)",
                  zIndex: 0,
                  transition: "width 0.3s ease",
                }}
              />

              {steps.map((s) => {
                const isPassed = s.num <= currentStep;
                const isCurrent = s.num === currentStep;

                return (
                  <div key={s.num} style={{ position: "relative", zIndex: 1, textAlign: "center", width: "70px" }}>
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: isPassed ? "var(--brand-rose)" : "#fff",
                        border: isPassed ? "2px solid var(--brand-rose)" : "2px solid #d6d3d1",
                        color: isPassed ? "#fff" : "#78716c",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "700",
                        margin: "0 auto 6px",
                      }}
                    >
                      {isPassed ? "✓" : s.num}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: isCurrent ? "700" : "500", color: isCurrent ? "var(--brand-rose)" : "var(--color-noir)", display: "block", lineHeight: 1.2 }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CASE DETAILS SUMMARY CARD */}
          <div style={{ background: "#fafaf9", borderRadius: "6px", border: "1px solid var(--border-subtle)", padding: "16px", marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px", marginBottom: "12px" }}>
              <div>
                <span style={{ color: "var(--color-text-muted)", display: "block" }}>Category</span>
                <strong style={{ color: "var(--color-noir)" }}>{formatCategory(ticket.category)}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)", display: "block" }}>Filed On</span>
                <strong>
                  {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
              {ticket.orderNumber && (
                <div>
                  <span style={{ color: "var(--color-text-muted)", display: "block" }}>Associated Order</span>
                  <strong style={{ fontFamily: "monospace" }}>{ticket.orderNumber}</strong>
                </div>
              )}
              <div>
                <span style={{ color: "var(--color-text-muted)", display: "block" }}>Current Status</span>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "700",
                    background: "var(--brand-rose-light)",
                    color: "var(--brand-rose)",
                    textTransform: "uppercase",
                  }}
                >
                  {ticket.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                Your Reported Issue & Notes:
              </span>
              <p style={{ fontSize: "13px", color: "var(--color-noir)", margin: 0, lineHeight: 1.5, background: "#fff", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                "{ticket.description}"
              </p>
            </div>
          </div>

          {/* CONCIERGE ATELIER UPDATES */}
          {ticket.adminNotes && (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#065f46", fontSize: "12px", fontWeight: "700", marginBottom: "4px", textTransform: "uppercase" }}>
                <CheckIcon size={14} /> Official Concierge & Atelier Update:
              </div>
              <p style={{ fontSize: "13px", color: "#047857", margin: 0, lineHeight: 1.5 }}>
                {ticket.adminNotes}
              </p>
            </div>
          )}

          {/* REFUND NOTICE */}
          {ticket.refundAmount && (
            <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "6px", padding: "14px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#6b21a8", fontWeight: "700", textTransform: "uppercase" }}>
                  Refund Dispatched
                </span>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#7e22ce" }}>
                  ₹{Number(ticket.refundAmount).toLocaleString("en-IN")}
                </div>
                <span style={{ fontSize: "11px", color: "#9333ea" }}>
                  Mode: {ticket.refundMethod?.replace(/_/g, " ") || "Bank Transfer"}
                </span>
              </div>
              {ticket.refundTransactionId && (
                <div style={{ textAlign: "right", fontSize: "11px", color: "#6b21a8" }}>
                  <span>Txn Ref:</span>
                  <div style={{ fontFamily: "monospace", fontWeight: "700" }}>{ticket.refundTransactionId}</div>
                </div>
              )}
            </div>
          )}

          {/* ATTACHED MEDIA & VIDEOS EVIDENCE */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-noir)", display: "block", marginBottom: "8px" }}>
                Attached Evidence Files ({ticket.attachments.length}):
              </span>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {ticket.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: att.type === "video" ? "180px" : "90px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid var(--border-medium)",
                      background: "#000",
                    }}
                  >
                    {att.type === "video" ? (
                      <div>
                        <video src={att.url} controls style={{ width: "100%", height: "100px", objectFit: "contain", background: "#1c1917" }} />
                        <div style={{ background: "#fafaf9", padding: "3px 6px", fontSize: "9px", color: "var(--brand-rose)", fontWeight: "700" }}>
                          ▶ COMPLAINT VIDEO
                        </div>
                      </div>
                    ) : (
                      <a href={att.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                        <img src={att.url} alt="" style={{ width: "100%", height: "90px", objectFit: "cover" }} />
                        <div style={{ background: "#fafaf9", padding: "3px 6px", fontSize: "9px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.name || "Photo Evidence"}
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS & WHATSAPP SUPPORT */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)" }}>
            <a
              href={`https://wa.me/919220350565?text=Hello%20PQN%20Concierge,%20I%20am%20following%20up%20on%20my%20complaint%20ticket%20%23${ticket.ticketNumber}%20(${encodeURIComponent(ticket.subject)}).`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "4px",
                background: "#25D366",
                color: "#fff",
                fontSize: "12px",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              <WhatsAppIcon size={14} /> WhatsApp Concierge Support
            </a>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ padding: "8px 20px", fontSize: "12px" }}
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
