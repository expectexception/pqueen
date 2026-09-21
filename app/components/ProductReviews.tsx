"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SparklesIcon,
  CheckIcon,
  CloseIcon,
  ArrowRightIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@/app/components/Icons";
import { useToast } from "@/app/context/ToastContext";

type Review = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  authorName: string;
  authorEmail: string;
  isVerified: boolean;
  images: string[];
  helpfulVotes: number;
  createdAt: string;
};

type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recommendPercentage: number;
};

type ProductReviewsProps = {
  productId: string;
  productName: string;
};

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all"); // all | with_photos | 5 | 4

  // Modal / Form state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Lightbox Modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Voted reviews tracking
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadReviews() {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (!res.ok) throw new Error("Failed to load reviews.");
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error("LOAD REVIEWS ERROR:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formImages.length + files.length > 5) {
      setFormError("You can upload a maximum of 5 photos.");
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setFormError("Please select valid image files.");
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        setFormError("Each photo must be under 8 MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    setFormError("");
  }

  function handleRemoveImage(index: number) {
    setFormImages((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim() || !formComment.trim() || !formName.trim() || !formEmail.trim()) {
      setFormError("Please fill in all required review fields.");
      return;
    }

    if (!formEmail.includes("@")) {
      setFormError("Please provide a valid email address.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: formRating,
          title: formTitle,
          comment: formComment,
          authorName: formName,
          authorEmail: formEmail,
          images: formImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      showToast("Thank you! Your verified review has been published.", { type: "success" });
      setIsWriteModalOpen(false);
      // Reset form
      setFormTitle("");
      setFormComment("");
      setFormName("");
      setFormEmail("");
      setFormImages([]);
      setFormRating(5);
      // Refresh reviews list
      loadReviews();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVoteHelpful(reviewId: string) {
    if (votedMap[reviewId]) return;

    // Optimistic UI update
    setVotedMap((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulVotes: r.helpfulVotes + 1 } : r))
    );

    try {
      await fetch(`/api/reviews/${reviewId}/vote`, { method: "POST" });
    } catch {
      // ignore
    }
  }

  const ratingDescriptions = [
    "",
    "1 Star - Poor Fit or Quality",
    "2 Stars - Below Expectations",
    "3 Stars - Average Ensemble",
    "4 Stars - Very Pleased with Outfit",
    "5 Stars - Exceptional Haute Couture Masterpiece",
  ];

  // Filtered reviews list
  const filteredReviews = reviews.filter((r) => {
    if (filterType === "with_photos") return r.images && r.images.length > 0;
    if (filterType === "5") return r.rating === 5;
    if (filterType === "4") return r.rating === 4;
    return true;
  });

  // Extract all customer photos for the lookbook gallery
  const allCustomerPhotos = reviews.flatMap((r) => r.images || []);

  return (
    <section id="reviews-section" style={{ marginTop: "80px", paddingTop: "60px", borderTop: "1px solid var(--border-subtle)" }}>
      {/* SECTION HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="section-eyebrow">VERIFIED CLIENT TESTIMONIALS</span>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", margin: "6px 0 0", color: "var(--color-noir)" }}>
            Customer Ratings & Reviews
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsWriteModalOpen(true)}
          className="btn-primary"
          style={{ padding: "12px 24px", fontSize: "12px", letterSpacing: "1px" }}
        >
          ★ WRITE A REVIEW
        </button>
      </div>

      {/* RATINGS HERO SUMMARY CARD */}
      {stats && (
        <div
          style={{
            background: "#fafaf9",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "32px",
            display: "grid",
            gridTemplateColumns: "240px 1fr 240px",
            gap: "36px",
            alignItems: "center",
            marginBottom: "40px",
          }}
          className="reviews-summary-grid"
        >
          {/* Average Rating Block */}
          <div style={{ textAlign: "center", borderRight: "1px solid var(--border-subtle)", paddingRight: "24px" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "52px", fontWeight: "400", color: "var(--color-noir)", lineHeight: 1 }}>
              {stats.averageRating.toFixed(1)}
            </div>
            <div style={{ color: "#eab308", fontSize: "20px", margin: "8px 0" }}>
              {"★".repeat(Math.round(stats.averageRating))}
              {"☆".repeat(5 - Math.round(stats.averageRating))}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: "500" }}>
              Based on {stats.totalReviews} verified reviews
            </div>
          </div>

          {/* Star Rating Distribution Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingBreakdown[star as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;

              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                  <span style={{ width: "40px", textAlign: "right", color: "var(--color-noir)", fontWeight: "600" }}>
                    {star} ★
                  </span>
                  <div style={{ flex: 1, height: "8px", background: "#e7e5e4", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: star >= 4 ? "var(--brand-rose)" : "#a8a29e",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <span style={{ width: "36px", color: "var(--color-text-muted)", fontSize: "11px" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Satisfaction Metric Box */}
          <div style={{ textAlign: "center", borderLeft: "1px solid var(--border-subtle)", paddingLeft: "24px" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "40px", color: "var(--brand-rose)", lineHeight: 1 }}>
              {stats.recommendPercentage}%
            </div>
            <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-noir)", marginTop: "6px" }}>
              Recommend This Look
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
              Tested for authentic luxury fabric and true-to-size drape.
            </p>
          </div>
        </div>
      )}

      {/* CUSTOMER LOOKBOOK PHOTO GALLERY STRIP */}
      {allCustomerPhotos.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "14px", color: "var(--color-noir)", display: "flex", alignItems: "center", gap: "6px" }}>
            <SparklesIcon size={14} /> Customer Try-On & Lookbook Photos ({allCustomerPhotos.length})
          </h3>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "10px" }}>
            {allCustomerPhotos.map((photoUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxImage(photoUrl)}
                style={{
                  width: "110px",
                  height: "140px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  border: "1px solid var(--border-medium)",
                  flexShrink: 0,
                  cursor: "pointer",
                  padding: 0,
                  background: "#f5f5f4",
                }}
              >
                <img src={photoUrl} alt="Customer look" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "24px", overflowX: "auto" }}>
        {[
          { key: "all", label: `All Reviews (${reviews.length})` },
          { key: "with_photos", label: `With Photos (${allCustomerPhotos.length})` },
          { key: "5", label: `5 Stars (${stats?.ratingBreakdown[5] || 0})` },
          { key: "4", label: `4 Stars (${stats?.ratingBreakdown[4] || 0})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterType(tab.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: filterType === tab.key ? "700" : "500",
              background: filterType === tab.key ? "var(--color-noir)" : "#fafaf9",
              color: filterType === tab.key ? "#fff" : "var(--color-noir)",
              border: "1px solid var(--border-medium)",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REVIEWS LIST */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted)" }}>
          Loading verified client reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", background: "#fafaf9", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", margin: "0 0 16px" }}>
            No reviews matching this filter. Be the first to share your experience!
          </p>
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="btn-primary"
            style={{ padding: "10px 20px", fontSize: "12px" }}
          >
            ★ Write a Review
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                background: "#fff",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "24px",
              }}
            >
              {/* Top Meta Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <div style={{ color: "#eab308", fontSize: "16px", marginBottom: "4px" }}>
                    {"★".repeat(rev.rating)}
                    {"☆".repeat(5 - rev.rating)}
                  </div>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 4px", color: "var(--color-noir)" }}>
                    {rev.title}
                  </h4>
                </div>

                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Review Text */}
              <p style={{ fontSize: "13px", color: "var(--color-text-main)", lineHeight: 1.7, margin: "0 0 16px" }}>
                {rev.comment}
              </p>

              {/* Customer Photos (if any) */}
              {rev.images && rev.images.length > 0 && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  {rev.images.map((imgUrl, imgIdx) => (
                    <button
                      key={imgIdx}
                      type="button"
                      onClick={() => setLightboxImage(imgUrl)}
                      style={{
                        width: "80px",
                        height: "100px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid var(--border-subtle)",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <img src={imgUrl} alt="Review attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Footer Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f5f5f4" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                  <span style={{ fontWeight: "600", color: "var(--color-noir)" }}>{rev.authorName}</span>
                  {rev.isVerified && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#15803d", fontSize: "11px", fontWeight: "600" }}>
                      <CheckIcon size={12} /> Verified Purchaser
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleVoteHelpful(rev.id)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: votedMap[rev.id] ? "#15803d" : "var(--color-text-muted)",
                    fontWeight: "600",
                    cursor: votedMap[rev.id] ? "default" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Helpful ({rev.helpfulVotes})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      {isWriteModalOpen && (
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
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
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
                <span style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "1.2px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
                  VERIFIED REVIEW SUBMISSION
                </span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "16px", margin: 0, color: "var(--color-noir)" }}>
                  Review {productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                style={{ background: "none", border: "none", color: "#78716c", cursor: "pointer" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} style={{ padding: "24px" }}>
              {formError && (
                <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "4px", fontSize: "12px", marginBottom: "16px" }}>
                  {formError}
                </div>
              )}

              {/* Star Rating Interactive Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                  Overall Rating *
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", fontSize: "28px", cursor: "pointer" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormRating(star)}
                        style={{
                          color: (hoverRating || formRating) >= star ? "#eab308" : "#d6d3d1",
                          transition: "color 0.15s ease",
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-noir)", marginLeft: "8px" }}>
                    {ratingDescriptions[hoverRating || formRating]}
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                  Review Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Royal Perfection & Majestic Flare!"
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-medium)",
                    fontSize: "13px",
                  }}
                />
              </div>

              {/* Detailed Review */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                  Your Review & Fitting Feedback *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Tell us about the fabric quality, embroidery craftsmanship, fitting, and how you styled it..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-medium)",
                    fontSize: "13px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Media / Photo Upload with Live Previews */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                    Add Photos (Optional • Max 5)
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {formImages.length}/5 uploaded
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  {formImages.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "70px",
                        height: "85px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid var(--border-medium)",
                      }}
                    >
                      <img src={img} alt="Upload preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {formImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: "70px",
                        height: "85px",
                        borderRadius: "4px",
                        border: "1.5px dashed var(--border-medium)",
                        background: "#fafaf9",
                        color: "var(--color-text-muted)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      <span>+</span>
                      <span>Photo</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Author Name & Email */}
              <div className="review-author-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ananya Deshmukh"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-medium)",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  style={{
                    padding: "10px 20px",
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
                  style={{ padding: "10px 24px", fontSize: "12px", letterSpacing: "1px" }}
                >
                  {submitting ? "PUBLISHING..." : "SUBMIT VERIFIED REVIEW"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SIZE PHOTO LIGHTBOX ZOOM */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 4000,
            background: "rgba(0,0,0,0.9)",
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
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
            <img
              src={lightboxImage}
              alt="Customer Try-on Full Size"
              style={{ maxHeight: "85vh", maxWidth: "85vw", objectFit: "contain", borderRadius: "6px" }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
