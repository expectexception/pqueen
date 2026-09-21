"use client";

import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import {
  SearchIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  RefreshCwIcon,
} from "@/app/components/Icons";
import { useToast } from "@/app/context/ToastContext";
import { ProductInquiry, InquiryCategory, InquiryStatus } from "@/lib/inquiries";

export default function AdminInquiriesPage() {
  const { showToast } = useToast();

  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Active Inquiry Modal
  const [activeInquiry, setActiveInquiry] = useState<ProductInquiry | null>(null);
  const [modalForm, setModalForm] = useState<{
    status: InquiryStatus;
    adminNotes: string;
  }>({
    status: "NEW",
    adminNotes: "",
  });
  const [saving, setSaving] = useState(false);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadInquiries() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/inquiries");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load inquiries.");
      }
      const data = await res.json();
      setInquiries(data.inquiries || []);
      setMetrics(data.metrics || {});
    } catch (err: any) {
      setError(err.message || "Failed to load client inquiries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInquiries();
  }, []);

  function handleOpenDossier(inq: ProductInquiry) {
    setActiveInquiry(inq);
    setModalForm({
      status: inq.status,
      adminNotes: inq.adminNotes || "",
    });
  }

  async function handleSaveResolution(e: React.FormEvent) {
    e.preventDefault();
    if (!activeInquiry) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/inquiries/${activeInquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modalForm),
      });

      if (!res.ok) throw new Error("Failed to update inquiry.");

      showToast("Inquiry status updated successfully.", { type: "success" });
      setActiveInquiry(null);
      await loadInquiries();
    } catch (err: any) {
      showToast(err.message || "Could not save resolution.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteInquiry(id: string) {
    if (!confirm("Are you sure you want to permanently remove this inquiry record?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete inquiry.");

      setInquiries((prev) => prev.filter((i) => i.id !== id));
      showToast("Inquiry removed.", { type: "info" });
    } catch (err: any) {
      showToast(err.message || "Failed to delete inquiry.", { type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  function formatCategoryName(cat: InquiryCategory): string {
    switch (cat) {
      case "SIZING_FIT":
        return "Sizing & Alteration";
      case "CUSTOM_DESIGN":
        return "Custom Design / Neckline";
      case "FABRIC_COLOR":
        return "Fabric & Dyeing";
      case "BULK_BRIDAL":
        return "Bridal & Bulk Order";
      case "DELIVERY_TIMELINE":
        return "Delivery Rush";
      default:
        return "General Inquiry";
    }
  }

  function getStatusStyle(st: InquiryStatus) {
    switch (st) {
      case "NEW":
        return { bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
      case "IN_PROGRESS":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
      case "RESOLVED":
        return { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" };
      case "CLOSED":
        return { bg: "#f5f5f4", color: "#78716c", border: "#e7e5e4" };
      default:
        return { bg: "#f5f5f4", color: "#555", border: "#ddd" };
    }
  }

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesSearch =
        inq.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inq.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
        inq.subject.toLowerCase().includes(search.toLowerCase()) ||
        inq.message.toLowerCase().includes(search.toLowerCase()) ||
        (inq.productName && inq.productName.toLowerCase().includes(search.toLowerCase())) ||
        (inq.customerPhone && inq.customerPhone.includes(search));

      const matchesStatus = statusFilter === "ALL" || inq.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || inq.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [inquiries, search, statusFilter, categoryFilter]);

  return (
    <AdminLayout
      title="Client Inquiries & Bespoke Requests"
      subtitle="Manage product customization queries, bridal trousseau consultations, and attached reference media."
      actions={
        <button
          type="button"
          onClick={loadInquiries}
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
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* KPI METRICS BAR */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Total Inquiries
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "var(--color-noir)", margin: "4px 0" }}>
              {metrics.totalCount || inquiries.length}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Lifetime customer inquiries</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#b45309" }}>
              New Inquiries
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#b45309", margin: "4px 0" }}>
              {metrics.newCount || inquiries.filter((i) => i.status === "NEW").length}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Awaiting concierge response</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#1d4ed8" }}>
              In Progress / Atelier
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#1d4ed8", margin: "4px 0" }}>
              {metrics.inProgressCount || inquiries.filter((i) => i.status === "IN_PROGRESS").length}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Under tailor review</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#15803d" }}>
              Resolved & Quoted
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#15803d", margin: "4px 0" }}>
              {metrics.resolvedCount || inquiries.filter((i) => i.status === "RESOLVED").length}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Consultation complete</span>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "16px 20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <SearchIcon
              size={16}
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#888" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, phone, product, or keyword..."
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "12px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                fontSize: "12px",
              }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                fontSize: "12px",
                background: "#fff",
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                fontSize: "12px",
                background: "#fff",
              }}
            >
              <option value="ALL">All Inquiry Topics</option>
              <option value="SIZING_FIT">Sizing & Alterations</option>
              <option value="CUSTOM_DESIGN">Custom Design</option>
              <option value="FABRIC_COLOR">Fabric & Color</option>
              <option value="BULK_BRIDAL">Bridal & Bulk Order</option>
              <option value="DELIVERY_TIMELINE">Delivery Rush</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
        </div>

        {/* HIGH-DENSITY INQUIRIES TABLE */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading inquiries...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
              No client inquiries match your filter.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fafaf9", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-text-muted)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 16px" }}>Ref # & Date</th>
                    <th style={{ padding: "12px 16px" }}>Client</th>
                    <th style={{ padding: "12px 16px" }}>Product & Topic</th>
                    <th style={{ padding: "12px 16px" }}>Inquiry Summary</th>
                    <th style={{ padding: "12px 16px" }}>Media</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inq) => {
                    const st = getStatusStyle(inq.status);

                    return (
                      <tr key={inq.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        {/* Ref # & Date */}
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <strong style={{ color: "var(--brand-rose)", display: "block" }}>
                            #{inq.inquiryNumber}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                            {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </td>

                        {/* Client */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: "700", color: "var(--color-noir)" }}>
                            {inq.customerName}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                            {inq.customerEmail}
                          </div>
                          {inq.customerPhone && (
                            <div style={{ fontSize: "11px", color: "var(--brand-rose)", fontWeight: "600", marginTop: "2px" }}>
                              📞 {inq.customerPhone}
                            </div>
                          )}
                        </td>

                        {/* Product & Topic */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: "600", color: "var(--color-noir)" }}>
                            {inq.productName || "Custom Order"}
                          </div>
                          <span style={{ display: "inline-block", background: "var(--brand-rose-light)", color: "var(--brand-rose)", padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", marginTop: "2px" }}>
                            {formatCategoryName(inq.category)}
                          </span>
                        </td>

                        {/* Message */}
                        <td style={{ padding: "12px 16px", maxWidth: "260px" }}>
                          <div style={{ fontWeight: "600", color: "var(--color-noir)", marginBottom: "2px" }}>
                            {inq.subject}
                          </div>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {inq.message}
                          </p>
                        </td>

                        {/* Media */}
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          {inq.attachments && inq.attachments.length > 0 ? (
                            <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "700" }}>
                              📎 {inq.attachments.length} file(s)
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: "700",
                              background: st.bg,
                              color: st.color,
                              border: `1px solid ${st.border}`,
                            }}
                          >
                            {inq.status.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            {/* WhatsApp Quick Reply Link */}
                            {inq.customerPhone && (
                              <a
                                href={`https://wa.me/91${inq.customerPhone.replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(inq.customerName)},%20thank%20you%20for%20contacting%20PQN%20Party%20Queen%20regarding%20${encodeURIComponent(inq.productName || "your inquiry")}%20(Ref:%20%23${inq.inquiryNumber}).%20How%20can%20we%20assist%20you%20today?`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  background: "#25D366",
                                  color: "#fff",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  textDecoration: "none",
                                }}
                              >
                                💬 WhatsApp
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenDossier(inq)}
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
                              Review →
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inq.id)}
                              disabled={deletingId === inq.id}
                              style={{
                                padding: "4px 6px",
                                borderRadius: "4px",
                                background: "#fef2f2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                cursor: "pointer",
                              }}
                            >
                              <TrashIcon size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* INQUIRY DOSSIER MODAL */}
      {activeInquiry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
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
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--brand-rose)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  INQUIRY #{activeInquiry.inquiryNumber} • {formatCategoryName(activeInquiry.category)}
                </span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: "2px 0 0" }}>
                  {activeInquiry.subject}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveInquiry(null)}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Client & Product details */}
            <div style={{ background: "var(--bg-main)", padding: "14px 16px", borderRadius: "6px", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                <span><strong>Client:</strong> {activeInquiry.customerName} ({activeInquiry.customerEmail})</span>
                {activeInquiry.customerPhone && <span>📞 {activeInquiry.customerPhone}</span>}
              </div>
              {activeInquiry.productName && (
                <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                  <strong>Product:</strong> {activeInquiry.productName}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "var(--color-noir)", lineHeight: "1.5", marginTop: "6px", background: "#fff", padding: "10px", borderRadius: "4px", border: "1px solid var(--border-subtle)" }}>
                "{activeInquiry.message}"
              </div>

              {/* Media Attachments */}
              {activeInquiry.attachments && activeInquiry.attachments.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-noir)", display: "block", marginBottom: "6px" }}>
                    Attached Reference Media ({activeInquiry.attachments.length}):
                  </span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {activeInquiry.attachments.map((att, idx) => (
                      <div
                        key={idx}
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
                            <video src={att.url} controls style={{ width: "100%", height: "120px", objectFit: "contain", background: "#1c1917" }} />
                            <div style={{ background: "#fafaf9", padding: "4px", fontSize: "10px", color: "var(--brand-rose)", fontWeight: "700" }}>
                              ▶ REFERENCE VIDEO
                            </div>
                          </div>
                        ) : (
                          <a href={att.url} target="_blank" rel="noreferrer" style={{ display: "block" }}>
                            <img src={att.url} alt="" style={{ width: "100%", height: "100px", objectFit: "cover" }} />
                            <div style={{ background: "#fafaf9", padding: "4px", fontSize: "10px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {att.name || `Image ${idx + 1}`}
                            </div>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleSaveResolution}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", display: "block" }}>
                  Update Inquiry Status
                </label>
                <select
                  className="form-input"
                  value={modalForm.status}
                  onChange={(e) => setModalForm({ ...modalForm, status: e.target.value as InquiryStatus })}
                  style={{ width: "100%", height: "38px" }}
                >
                  <option value="NEW">NEW (Awaiting Stylist)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Tailor Consulting)</option>
                  <option value="RESOLVED">RESOLVED (Proposal / Quote Provided)</option>
                  <option value="CLOSED">CLOSED (Completed)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px", display: "block" }}>
                  Atelier & Tailor Internal Notes / Quote Details
                </label>
                <textarea
                  rows={3}
                  className="form-input"
                  placeholder="Record custom measurements agreed, price adjustments, fabric dye notes..."
                  value={modalForm.adminNotes}
                  onChange={(e) => setModalForm({ ...modalForm, adminNotes: e.target.value })}
                  style={{ width: "100%", padding: "10px", height: "auto" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setActiveInquiry(null)}
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
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: "8px 20px", fontSize: "12px", letterSpacing: "1px" }}
                >
                  {saving ? "SAVING..." : "SAVE RESOLUTION"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
