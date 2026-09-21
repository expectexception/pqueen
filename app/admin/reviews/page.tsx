"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import {
  SparklesIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  EyeIcon,
  SearchIcon,
  RefreshCwIcon,
} from "@/app/components/Icons";
import { useToast } from "@/app/context/ToastContext";

type AdminReview = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  authorName: string;
  authorEmail: string;
  isVerified: boolean;
  status: "APPROVED" | "PENDING" | "REJECTED";
  images: string[];
  helpfulVotes: number;
  createdAt: string;
  product?: {
    name: string;
    slug: string;
    sku: string;
    images?: { url: string }[];
  } | null;
};

export default function AdminReviewsPage() {
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  // Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadAdminReviews() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load reviews.");
      }
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminReviews();
  }, []);

  async function handleUpdateStatus(id: string, newStatus: "APPROVED" | "PENDING" | "REJECTED") {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status.");

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      showToast(`Review status updated to ${newStatus}`, { type: "success" });
    } catch (err: any) {
      showToast(err.message || "Failed to update review status.", { type: "error" });
    }
  }

  async function handleDeleteReview(id: string) {
    if (!confirm("Are you sure you want to permanently delete this customer review?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review.");

      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Review deleted successfully.", { type: "info" });
    } catch (err: any) {
      showToast(err.message || "Could not delete review.", { type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      r.authorName.toLowerCase().includes(search.toLowerCase()) ||
      r.authorEmail.toLowerCase().includes(search.toLowerCase()) ||
      (r.product?.name && r.product.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesRating = ratingFilter === "ALL" || r.rating.toString() === ratingFilter;

    return matchesSearch && matchesStatus && matchesRating;
  });

  // KPI Metrics
  const totalCount = reviews.length;
  const approvedCount = reviews.filter((r) => r.status === "APPROVED").length;
  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;
  const avgScore =
    totalCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
      : "5.0";

  return (
    <AdminLayout
      title="Product Reviews & Ratings"
      subtitle="Moderate verified client feedback, customer lookbook try-on photos, and ratings."
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
              Total Reviews
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "var(--color-noir)", margin: "4px 0" }}>
              {totalCount}
            </div>
            <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "600" }}>Across all catalog items</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Average Store Rating
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#eab308", margin: "4px 0" }}>
              {avgScore} ★
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>High client satisfaction</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Approved Reviews
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#15803d", margin: "4px 0" }}>
              {approvedCount}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Live on product pages</span>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "16px 20px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Pending Moderation
            </span>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: pendingCount > 0 ? "#b45309" : "var(--color-noir)", margin: "4px 0" }}>
              {pendingCount}
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Awaiting review</span>
          </div>
        </div>

        {/* SEARCH & FILTERS CONTROLS BAR */}
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
              placeholder="Search by product, reviewer, title..."
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

          {/* Status & Rating Filters */}
          <div style={{ display: "flex", gap: "10px" }}>
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
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                fontSize: "12px",
                background: "#fff",
              }}
            >
              <option value="ALL">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <button
              type="button"
              onClick={loadAdminReviews}
              style={{
                height: "38px",
                padding: "0 14px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                background: "#fafaf9",
                fontSize: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <RefreshCwIcon size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* HIGH-DENSITY COMPACT TABLE */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading client reviews...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
              No client reviews match your search filter.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fafaf9", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-text-muted)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "12px 16px" }}>Product</th>
                    <th style={{ padding: "12px 16px" }}>Rating & Title</th>
                    <th style={{ padding: "12px 16px" }}>Reviewer</th>
                    <th style={{ padding: "12px 16px" }}>Photos</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((rev) => (
                    <tr key={rev.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      {/* Product */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {rev.product?.images?.[0]?.url ? (
                            <img
                              src={rev.product.images[0].url}
                              alt=""
                              style={{ width: "36px", height: "46px", objectFit: "cover", borderRadius: "3px" }}
                            />
                          ) : (
                            <div style={{ width: "36px", height: "46px", background: "#f5f5f4", borderRadius: "3px" }} />
                          )}
                          <div>
                            <strong style={{ display: "block", color: "var(--color-noir)", fontSize: "12px" }}>
                              {rev.product?.name || "Catalog Product"}
                            </strong>
                            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                              SKU: {rev.product?.sku || "PQN"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rating & Title */}
                      <td style={{ padding: "12px 16px", maxWidth: "280px" }}>
                        <div style={{ color: "#eab308", fontSize: "13px", marginBottom: "2px" }}>
                          {"★".repeat(rev.rating)}
                          {"☆".repeat(5 - rev.rating)}
                        </div>
                        <div style={{ fontWeight: "700", color: "var(--color-noir)", marginBottom: "2px" }}>
                          {rev.title}
                        </div>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {rev.comment}
                        </p>
                      </td>

                      {/* Reviewer */}
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600", color: "var(--color-noir)" }}>
                          {rev.authorName}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {rev.authorEmail}
                        </div>
                        {rev.isVerified && (
                          <span style={{ fontSize: "10px", color: "#15803d", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "2px", marginTop: "2px" }}>
                            ✓ Verified Buyer
                          </span>
                        )}
                      </td>

                      {/* Photos */}
                      <td style={{ padding: "12px 16px" }}>
                        {rev.images && rev.images.length > 0 ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            {rev.images.map((imgUrl, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setLightboxImage(imgUrl)}
                                style={{
                                  width: "32px",
                                  height: "38px",
                                  borderRadius: "3px",
                                  overflow: "hidden",
                                  border: "1px solid var(--border-medium)",
                                  padding: 0,
                                  cursor: "pointer",
                                }}
                              >
                                <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>No photos</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "3px",
                            fontSize: "10px",
                            fontWeight: "700",
                            letterSpacing: "0.5px",
                            background:
                              rev.status === "APPROVED"
                                ? "#dcfce7"
                                : rev.status === "PENDING"
                                ? "#fef3c7"
                                : "#fee2e2",
                            color:
                              rev.status === "APPROVED"
                                ? "#15803d"
                                : rev.status === "PENDING"
                                ? "#b45309"
                                : "#991b1b",
                          }}
                        >
                          {rev.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {rev.status !== "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(rev.id, "APPROVED")}
                              title="Approve Review"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "3px",
                                background: "#15803d",
                                color: "#fff",
                                border: "none",
                                fontSize: "11px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {rev.status === "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(rev.id, "REJECTED")}
                              title="Reject Review"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "3px",
                                background: "#f5f5f4",
                                color: "#78716c",
                                border: "1px solid var(--border-medium)",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            disabled={deletingId === rev.id}
                            title="Delete Review"
                            style={{
                              padding: "4px 6px",
                              borderRadius: "3px",
                              background: "#fef2f2",
                              color: "#991b1b",
                              border: "1px solid #fecaca",
                              cursor: "pointer",
                            }}
                          >
                            <TrashIcon size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FULL SIZE PHOTO LIGHTBOX */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 4000,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              style={{ position: "absolute", top: "-36px", right: 0, background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
            >
              ✕ Close
            </button>
            <img src={lightboxImage} alt="" style={{ maxHeight: "85vh", maxWidth: "85vw", objectFit: "contain", borderRadius: "6px" }} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
