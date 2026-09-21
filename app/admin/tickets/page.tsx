"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import AdminLayout from "@/app/components/AdminLayout";
import { SearchIcon, CheckIcon, CloseIcon, LifeBuoyIcon } from "@/app/components/Icons";
import { SupportTicket, TicketCategory, TicketStatus, TicketPriority } from "@/lib/tickets";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Active modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [modalForm, setModalForm] = useState<{
    status: TicketStatus;
    priority: TicketPriority;
    refundAmount: number;
    refundMethod: "ORIGINAL_PAYMENT" | "STORE_CREDIT" | "BANK_TRANSFER";
    refundTransactionId: string;
    adminNotes: string;
  }>({
    status: "OPEN",
    priority: "MEDIUM",
    refundAmount: 0,
    refundMethod: "BANK_TRANSFER",
    refundTransactionId: "",
    adminNotes: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadTickets() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tickets");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load tickets.");
      }
      const data = await res.json();
      setTickets(data.tickets || []);
      setMetrics(data.metrics || {});
    } catch (err: any) {
      setError(err.message || "Failed to load helpdesk records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  function handleOpenDossier(ticket: SupportTicket) {
    setActiveTicket(ticket);
    setModalForm({
      status: ticket.status,
      priority: ticket.priority,
      refundAmount: ticket.refundAmount || 0,
      refundMethod: ticket.refundMethod || "BANK_TRANSFER",
      refundTransactionId: ticket.refundTransactionId || "",
      adminNotes: ticket.adminNotes || "",
    });
  }

  async function handleSaveResolution(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTicket) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/tickets/${activeTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modalForm),
      });

      if (!res.ok) throw new Error("Failed to update resolution.");

      setActiveTicket(null);
      await loadTickets();
    } catch (err: any) {
      alert(err.message || "Could not save resolution.");
    } finally {
      setSaving(false);
    }
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const numMatch = t.ticketNumber.toLowerCase().includes(q);
        const nameMatch = t.customerName.toLowerCase().includes(q);
        const emailMatch = t.customerEmail.toLowerCase().includes(q);
        const orderMatch = (t.orderNumber || "").toLowerCase().includes(q);
        const subjectMatch = t.subject.toLowerCase().includes(q);

        return numMatch || nameMatch || emailMatch || orderMatch || subjectMatch;
      }
      return true;
    });
  }, [tickets, statusFilter, search]);

  function getStatusStyle(status: TicketStatus) {
    switch (status) {
      case "OPEN":
        return { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" };
      case "UNDER_REVIEW":
        return { bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
      case "REFUND_APPROVED":
        return { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff" };
      case "REFUND_PROCESSED":
      case "RESOLVED":
      case "CLOSED":
        return { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" };
      case "EXCHANGE_SHIPPED":
        return { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" };
      default:
        return { bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" };
    }
  }

  function getPriorityBadge(priority: TicketPriority) {
    switch (priority) {
      case "URGENT":
        return { bg: "#fee2e2", color: "#991b1b", label: "URGENT" };
      case "HIGH":
        return { bg: "#ffedd5", color: "#c2410c", label: "HIGH" };
      case "MEDIUM":
        return { bg: "#fef3c7", color: "#92400e", label: "MED" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280", label: "LOW" };
    }
  }

  function formatCategoryName(cat: TicketCategory) {
    switch (cat) {
      case "RETURN_REFUND":
        return "Return & Refund";
      case "SIZE_EXCHANGE":
        return "Size Exchange";
      case "DAMAGED_DEFECTIVE":
        return "Damaged Item";
      case "SHIPPING_DELAY":
        return "Shipping Delay";
      case "QUALITY_CONCERN":
        return "Quality Concern";
      default:
        return "General Inquiry";
    }
  }

  return (
    <AdminLayout
      title="Complaints, Returns & Refund Helpdesk"
      actions={
        <button
          type="button"
          onClick={loadTickets}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            background: "#fff",
            border: "1px solid var(--border-medium)",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          ↻ Refresh
        </button>
      }
    >
      {/* 4 SUMMARY METRIC TILES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "18px" }}>
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Filed Cases</span>
          <div style={{ fontSize: "22px", fontWeight: "700", margin: "3px 0" }}>{metrics.total || 0}</div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Lifetime support tickets</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#c2410c", textTransform: "uppercase" }}>Open Complaints</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#c2410c", margin: "3px 0" }}>
            {(metrics.open || 0) + (metrics.underReview || 0)}
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Requires concierge review</span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#7e22ce", textTransform: "uppercase" }}>Refunds Queue</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#7e22ce", margin: "3px 0" }}>
            ₹{Number(metrics.totalRefundAmount || 0).toLocaleString("en-IN")}
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {metrics.refundApproved || 0} approved for payout
          </span>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "14px 16px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#15803d", textTransform: "uppercase" }}>Resolved Cases</span>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#15803d", margin: "3px 0" }}>
            {metrics.closed || 0}
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Fully completed</span>
        </div>
      </div>

      {/* SEARCH & STATUS FILTER STRIP */}
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border-subtle)",
          borderRadius: "6px",
          padding: "10px 14px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by Ticket #, Customer Name, Email, or Order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: "34px",
              padding: "0 12px 0 32px",
              border: "1px solid var(--border-medium)",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          />
          <div style={{ position: "absolute", left: "10px", top: "9px", color: "#a8a29e" }}>
            <SearchIcon size={14} />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {["ALL", "OPEN", "UNDER_REVIEW", "REFUND_APPROVED", "REFUND_PROCESSED", "CLOSED"].map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: isSelected ? "700" : "500",
                  border: isSelected ? "1px solid var(--color-noir)" : "1px solid var(--border-subtle)",
                  background: isSelected ? "var(--color-noir)" : "#fff",
                  color: isSelected ? "#fff" : "var(--color-noir)",
                  cursor: "pointer",
                }}
              >
                {st.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* TICKETS TABLE */}
      {loading ? (
        <div style={{ padding: "50px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>Loading support helpdesk...</h3>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "50px 20px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>No support tickets found</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>All customer complaints and refunds are up to date.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", overflowX: "auto", boxShadow: "var(--shadow-xs)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px", minWidth: "850px" }}>
            <thead>
              <tr style={{ background: "#fafaf9", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "110px" }}>Ticket #</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "80px" }}>Date</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "150px" }}>Customer</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "120px" }}>Order #</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Issue Category & Subject</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "60px" }}>Priority</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "120px" }}>Status</th>
                <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", width: "90px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => {
                const stStyle = getStatusStyle(t.status);
                const prStyle = getPriorityBadge(t.priority);

                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {/* Ticket Number */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <strong style={{ color: "var(--brand-rose)" }}>{t.ticketNumber}</strong>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                      {new Date(t.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "10px 14px" }}>
                      <strong style={{ color: "var(--color-noir)", display: "block" }}>{t.customerName}</strong>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{t.customerEmail}</span>
                    </td>

                    {/* Order # */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {t.orderNumber ? (
                        <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-noir)" }}>
                          {t.orderNumber}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>

                    {/* Category & Subject */}
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "inline-block", background: "var(--brand-rose-light)", color: "var(--brand-rose)", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", marginBottom: "2px" }}>
                        {formatCategoryName(t.category)}
                      </div>
                      <div style={{ color: "var(--color-noir)", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }}>
                        {t.subject}
                      </div>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ background: prStyle.bg, color: prStyle.color, padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" }}>
                        {prStyle.label}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "10px",
                          fontWeight: "700",
                          background: stStyle.bg,
                          color: stStyle.color,
                          border: `1px solid ${stStyle.border}`,
                        }}
                      >
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDossier(t)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          border: "1px solid var(--border-medium)",
                          background: "#fff",
                          color: "var(--color-noir)",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Resolve →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* RESOLUTION DOSSIER MODAL */}
      {activeTicket && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px 28px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--brand-rose)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  TICKET #{activeTicket.ticketNumber} • {formatCategoryName(activeTicket.category)}
                </span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "2px 0 0" }}>
                  {activeTicket.subject}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Customer & Issue Description Card */}
            <div style={{ background: "var(--bg-main)", padding: "14px 16px", borderRadius: "6px", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                <span><strong>Customer:</strong> {activeTicket.customerName} ({activeTicket.customerEmail})</span>
                {activeTicket.customerPhone && <span>📞 {activeTicket.customerPhone}</span>}
              </div>
              {activeTicket.orderNumber && (
                <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                  <strong>Associated Order:</strong> <span style={{ fontFamily: "monospace" }}>{activeTicket.orderNumber}</span>
                </div>
              )}
              <div style={{ fontSize: "12px", color: "var(--color-noir)", lineHeight: "1.5", marginTop: "6px", background: "#fff", padding: "10px", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                "{activeTicket.description}"
              </div>

              {/* ATTACHED EVIDENCE VIDEOS & PHOTOS */}
              {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-noir)", display: "block", marginBottom: "6px" }}>
                    Attached Media & Complaint Evidence ({activeTicket.attachments.length}):
                  </span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {activeTicket.attachments.map((att, i) => (
                      <div
                        key={i}
                        style={{
                          width: att.type === "video" ? "200px" : "100px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "1px solid var(--border-medium)",
                          background: "#000",
                        }}
                      >
                        {att.type === "video" ? (
                          <div>
                            <video
                              src={att.url}
                              controls
                              style={{ width: "100%", height: "120px", objectFit: "contain", background: "#1c1917" }}
                            />
                            <div style={{ background: "#fafaf9", padding: "4px", fontSize: "10px", color: "var(--brand-rose)", fontWeight: "700" }}>
                              ▶ COMPLAINT VIDEO
                            </div>
                          </div>
                        ) : (
                          <a href={att.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                            <img src={att.url} alt="" style={{ width: "100%", height: "100px", objectFit: "cover" }} />
                            <div style={{ background: "#fafaf9", padding: "4px", fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {att.name || "Photo"}
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Resolution Form */}
            <form onSubmit={handleSaveResolution}>
              <div className="form-row" style={{ marginBottom: "12px" }}>
                <div className="form-group">
                  <label>Update Ticket Status</label>
                  <select
                    className="form-input"
                    value={modalForm.status}
                    onChange={(e) => setModalForm({ ...modalForm, status: e.target.value as TicketStatus })}
                  >
                    <option value="OPEN">OPEN (Queue)</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="REFUND_APPROVED">REFUND APPROVED</option>
                    <option value="REFUND_PROCESSED">REFUND PROCESSED</option>
                    <option value="EXCHANGE_SHIPPED">EXCHANGE SHIPPED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-input"
                    value={modalForm.priority}
                    onChange={(e) => setModalForm({ ...modalForm, priority: e.target.value as TicketPriority })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              {/* Refund Section */}
              <div style={{ background: "#fcfaf8", padding: "14px", borderRadius: "6px", border: "1px solid var(--border-subtle)", marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--brand-rose)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  💰 Refund & Financial Processing
                </span>

                <div className="form-row">
                  <div className="form-group">
                    <label>Refund Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={modalForm.refundAmount}
                      onChange={(e) => setModalForm({ ...modalForm, refundAmount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Refund Channel</label>
                    <select
                      className="form-input"
                      value={modalForm.refundMethod}
                      onChange={(e) => setModalForm({ ...modalForm, refundMethod: e.target.value as any })}
                    >
                      <option value="BANK_TRANSFER">Bank IMPS / NEFT Transfer</option>
                      <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
                      <option value="STORE_CREDIT">Store Credit Voucher</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "8px" }}>
                  <label>Refund Reference / UTR Transaction ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UTR-829401824"
                    value={modalForm.refundTransactionId}
                    onChange={(e) => setModalForm({ ...modalForm, refundTransactionId: e.target.value })}
                  />
                </div>
              </div>

              {/* Admin Internal Notes */}
              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label>Resolution Summary & Internal Notes</label>
                <textarea
                  rows={3}
                  className="form-input"
                  style={{ height: "auto", padding: "8px", fontSize: "12px" }}
                  placeholder="Notes on communication with customer or courier pickup..."
                  value={modalForm.adminNotes}
                  onChange={(e) => setModalForm({ ...modalForm, adminNotes: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  disabled={saving}
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
                  className="btn-primary"
                  disabled={saving}
                  style={{ padding: "8px 20px", fontSize: "12px" }}
                >
                  {saving ? "SAVING RESOLUTION..." : "SAVE & UPDATE CASE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
