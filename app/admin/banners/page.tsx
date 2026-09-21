"use client";

import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { PlusIcon, TrashIcon, SparklesIcon, CheckIcon, EyeIcon, CloseIcon } from "@/app/components/Icons";
import { uploadOptimizedImage } from "@/lib/image-upload-client";

type BannerSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  badge?: string;
  active: boolean;
  order: number;
};

type BannerData = {
  heroSlides: BannerSlide[];
  announcements: string[];
  promoCard: {
    title: string;
    description: string;
    couponCode: string;
    discountPercent: number;
    active: boolean;
  };
};

export default function AdminBannersPage() {
  const [data, setData] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  // Slide Modal
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingSlide, setSavingSlide] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadBanners() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/banners");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load storefront banners.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load banners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  async function handleToggleSlideActive(slide: BannerSlide) {
    if (!data) return;
    const updatedSlides = data.heroSlides.map((s) =>
      s.id === slide.id ? { ...s, active: !s.active } : s
    );
    setData({ ...data, heroSlides: updatedSlides });

    try {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_slide",
          slide: { ...slide, active: !slide.active },
        }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteSlide(slideId: string) {
    if (!confirm("Are you sure you want to delete this storefront banner slide?")) return;
    if (!data) return;

    const updatedSlides = data.heroSlides.filter((s) => s.id !== slideId);
    setData({ ...data, heroSlides: updatedSlides });

    try {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_slide", slideId }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  function handleOpenNewSlide() {
    setEditingSlide({
      id: "",
      title: "Elegance Crafted for Your Special Moments",
      subtitle: "Immerse yourself in artisan-embroidered designer lehengas, majestic royal suit sets, and breathtaking party wear curated to make you the queen of every occasion.",
      imageUrl: "",
      ctaText: "EXPLORE COLLECTION",
      ctaLink: "/shop",
      ctaSecondaryText: "NEW ARRIVALS",
      ctaSecondaryLink: "/shop?filter=new",
      badge: "2026 Haute Couture Collection",
      active: true,
      order: (data?.heroSlides.length || 0) + 1,
    });
    setIsModalOpen(true);
  }

  function handleOpenEditSlide(slide: BannerSlide) {
    setEditingSlide({
      ...slide,
      ctaSecondaryText: slide.ctaSecondaryText || "NEW ARRIVALS",
      ctaSecondaryLink: slide.ctaSecondaryLink || "/shop?filter=new",
    });
    setIsModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;

    try {
      setUploadingImage(true);
      const url = await uploadOptimizedImage(file, { maxWidth: 2200, quality: 0.88 });
      setEditingSlide({ ...editingSlide, imageUrl: url });
    } catch (err: any) {
      console.error("Banner upload failed:", err);
      setError(err?.message || "Failed to upload banner image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveSlideForm(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSlide) return;

    setSavingSlide(true);
    try {
      const isNew = !editingSlide.id;
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isNew ? "add_slide" : "update_slide",
          slide: editingSlide,
        }),
      });

      if (!res.ok) throw new Error("Failed to save slide.");
      const json = await res.json();
      setData(json.data);
      setIsModalOpen(false);
      setEditingSlide(null);
      setSavedMessage("Hero banner background & texts updated successfully.");
      setTimeout(() => setSavedMessage(""), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to save slide.");
    } finally {
      setSavingSlide(false);
    }
  }

  async function handleSavePromoCard(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_all",
          promoCard: data.promoCard,
        }),
      });
      if (res.ok) {
        setSavedMessage("Promotional banner card saved.");
        setTimeout(() => setSavedMessage(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Banners & Hero Sliders">
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-serif)" }}>Loading storefront banner controls...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Banners & Hero Sliders">
        <p style={{ color: "#991b1b" }}>{error || "Unable to load banners."}</p>
        <button type="button" onClick={loadBanners} className="btn-primary" style={{ marginTop: "12px" }}>
          Retry
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Storefront Banners & Sliders"
      actions={
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href="/"
            target="_blank"
            style={{
              padding: "8px 14px",
              borderRadius: "4px",
              background: "#fff",
              border: "1px solid #d1d5db",
              color: "#374151",
              fontSize: "12px",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <EyeIcon size={14} /> View Storefront
          </a>
          <button
            type="button"
            onClick={handleOpenNewSlide}
            className="btn-primary"
            style={{ padding: "8px 16px", fontSize: "12px", background: "#0d4428", borderColor: "#c59b27", color: "#f5d77f" }}
          >
            <PlusIcon size={16} /> ADD HERO SLIDE
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "28px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
            MARKETING & VISUAL MERCHANDISING
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", margin: "4px 0" }}>
            Hero Sliders & Background Image Manager
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
            Upload custom background images, update headline texts, CTA buttons, and campaign slides displayed at the top of your homepage.
          </p>
        </div>

        {savedMessage && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "12px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "700", marginBottom: "20px", border: "1px solid #bbf7d0" }}>
            ✓ {savedMessage}
          </div>
        )}

        {/* 1. HERO SLIDERS LIST */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", margin: 0, color: "#0d4428" }}>
                Homepage Hero Slides & Backgrounds ({data.heroSlides.length})
              </h2>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Active slides are rendered in rotation on the homepage with high-res background photos & custom buttons.
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenNewSlide}
              style={{
                padding: "7px 16px",
                borderRadius: "4px",
                background: "#0d4428",
                color: "#f5d77f",
                border: "1px solid #c59b27",
                fontSize: "11.5px",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <PlusIcon size={14} /> NEW SLIDE
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {data.heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr auto",
                  gap: "20px",
                  alignItems: "center",
                  padding: "16px 20px",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  background: slide.active ? "#fff" : "#fafaf9",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* PREVIEW THUMB */}
                <div
                  style={{
                    width: "140px",
                    height: "85px",
                    borderRadius: "6px",
                    background: slide.imageUrl ? "#072818" : "linear-gradient(135deg, #072818, #0a3320)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    border: "1px solid #c59b27",
                    position: "relative",
                  }}
                >
                  {slide.imageUrl ? (
                    <>
                      <img src={slide.imageUrl} alt={slide.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(7,40,24,0.4)" }} />
                      <span style={{ position: "relative", zIndex: 2, color: "#fff", fontSize: "10px", fontWeight: "800", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: "3px" }}>
                        CUSTOM BG
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "#f5d77f", fontSize: "11px", fontWeight: "800" }}>DEFAULT GRADIENT</span>
                  )}
                </div>

                {/* INFO */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", background: "rgba(197,155,39,0.15)", color: "#967417", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(197,155,39,0.3)" }}>
                      {slide.badge || "Featured"}
                    </span>
                    <strong style={{ fontSize: "15px", color: "var(--color-noir)" }}>{slide.title}</strong>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "0 0 6px", lineHeight: "1.4" }}>
                    {slide.subtitle}
                  </p>
                  <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "#6b7280" }}>
                    <span>Primary CTA: <strong style={{ color: "#0d4428" }}>{slide.ctaText}</strong></span>
                    <span>Link: <code>{slide.ctaLink}</code></span>
                    {slide.imageUrl && <span style={{ color: "#15803d", fontWeight: "700" }}>🖼️ Custom Background Active</span>}
                  </div>
                </div>

                {/* CONTROLS */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleToggleSlideActive(slide)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "800",
                      cursor: "pointer",
                      border: slide.active ? "1px solid #bbf7d0" : "1px solid #d1d5db",
                      background: slide.active ? "#f0fdf4" : "#f3f4f6",
                      color: slide.active ? "#15803d" : "#6b7280",
                    }}
                  >
                    {slide.active ? "● LIVE ACTIVE" : "○ PAUSED"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditSlide(slide)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "1px solid #0d4428",
                      background: "#0d4428",
                      color: "#f5d77f",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    ✏️ Edit Slide & BG
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slide.id)}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "4px",
                      border: "1px solid #fee2e2",
                      background: "#fff",
                      color: "#991b1b",
                      cursor: "pointer",
                    }}
                    title="Delete Slide"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. CELEBRATION PROMOTIONAL CARD */}
        <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "24px", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "18px", marginBottom: "4px", color: "#0d4428" }}>
            Storefront Celebration Coupon Banner
          </h2>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "20px" }}>
            The full-width call-to-action coupon banner shown on the homepage
          </span>

          <form onSubmit={handleSavePromoCard} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Headline Title:</label>
              <input
                type="text"
                className="form-input"
                value={data.promoCard.title}
                onChange={(e) => setData({ ...data, promoCard: { ...data.promoCard, title: e.target.value } })}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Description Subtext:</label>
              <input
                type="text"
                className="form-input"
                value={data.promoCard.description}
                onChange={(e) => setData({ ...data, promoCard: { ...data.promoCard, description: e.target.value } })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Coupon Code:</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ textTransform: "uppercase", fontWeight: "700" }}
                  value={data.promoCard.couponCode}
                  onChange={(e) => setData({ ...data, promoCard: { ...data.promoCard, couponCode: e.target.value.toUpperCase() } })}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>Discount (%):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  value={data.promoCard.discountPercent}
                  onChange={(e) => setData({ ...data, promoCard: { ...data.promoCard, discountPercent: Number(e.target.value) } })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button type="submit" className="btn-primary" style={{ padding: "10px 24px", fontSize: "12px", background: "#0d4428", borderColor: "#c59b27", color: "#f5d77f" }}>
                SAVE PROMO BANNER
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SLIDE EDIT / CREATE MODAL */}
      {isModalOpen && editingSlide && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingSlide) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              maxHeight: "92vh",
              background: "#fff",
              borderRadius: "8px",
              border: "1px solid #c59b27",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #ede7e1", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#072818", color: "#f5d77f" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SparklesIcon size={18} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  {editingSlide.id ? "Edit Hero Banner & Background" : "Add New Hero Banner Slide"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", color: "#f5d77f", cursor: "pointer" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleSaveSlideForm} style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* BADGE & HEADLINE */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Badge Pill (e.g. 2026 Haute Couture Collection):
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingSlide.badge || ""}
                  onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                  placeholder="✨ 2026 HAUTE COUTURE COLLECTION"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Main Slide Headline *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="e.g. Elegance Crafted for Your Special Moments"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Subtitle Description:
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={editingSlide.subtitle}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  placeholder="Immerse yourself in artisan-embroidered designer lehengas..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                />
              </div>

              {/* BUTTONS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                    Primary Button Text & Link:
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="Label (e.g. EXPLORE COLLECTION)"
                      value={editingSlide.ctaText}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}
                    />
                    <input
                      type="text"
                      placeholder="Link (/shop)"
                      value={editingSlide.ctaLink}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                    Secondary Button Text & Link:
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      placeholder="Label (e.g. NEW ARRIVALS)"
                      value={editingSlide.ctaSecondaryText || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaSecondaryText: e.target.value })}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}
                    />
                    <input
                      type="text"
                      placeholder="Link (/shop?filter=new)"
                      value={editingSlide.ctaSecondaryLink || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaSecondaryLink: e.target.value })}
                      style={{ flex: 1, padding: "8px 10px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>

              {/* BACKGROUND IMAGE UPLOADER */}
              <div style={{ background: "#fafaf9", border: "1.5px dashed #c59b27", borderRadius: "6px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: "#0d4428" }}>
                    🖼️ Hero Background Image (Frequently Changable)
                  </label>
                  {editingSlide.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingSlide({ ...editingSlide, imageUrl: "" })}
                      style={{ fontSize: "11px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Reset to Default Gradient
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Enter background image URL or upload from your device..."
                    value={editingSlide.imageUrl || ""}
                    onChange={(e) => setEditingSlide({ ...editingSlide, imageUrl: e.target.value })}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px" }}
                  />

                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "4px",
                      background: "#0d4428",
                      color: "#f5d77f",
                      border: "1px solid #c59b27",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {uploadingImage ? "Uploading..." : "📸 Upload Photo"}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </div>
              </div>

              {/* LIVE REAL-TIME PREVIEW IN MODAL */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#6b7280", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  👁️ Real-time Hero Banner Preview:
                </span>

                <div
                  style={{
                    position: "relative",
                    borderRadius: "10px",
                    overflow: "hidden",
                    padding: "36px 20px",
                    textAlign: "center",
                    background: editingSlide.imageUrl
                      ? "#072818"
                      : "linear-gradient(145deg, #f0f7f3 0%, #fefefd 50%, #e8f3ec 100%)",
                    border: "1px solid #c59b27",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                >
                  {editingSlide.imageUrl && (
                    <>
                      <img
                        src={editingSlide.imageUrl}
                        alt="Hero Background Preview"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(7,40,24,0.4) 0%, rgba(7,40,24,0.72) 60%, rgba(7,40,24,0.92) 100%)",
                        }}
                      />
                    </>
                  )}

                  <div style={{ position: "relative", zIndex: 3, maxWidth: "560px", margin: "0 auto" }}>
                    {editingSlide.badge && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 14px",
                          borderRadius: "20px",
                          background: editingSlide.imageUrl ? "rgba(7,40,24,0.85)" : "#fff",
                          border: "1px solid rgba(197,155,39,0.5)",
                          fontSize: "10px",
                          fontWeight: "700",
                          letterSpacing: "2px",
                          color: editingSlide.imageUrl ? "#f5d77f" : "#0d4428",
                          marginBottom: "12px",
                        }}
                      >
                        <SparklesIcon size={12} />
                        <span>{editingSlide.badge}</span>
                      </div>
                    )}

                    <h2
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: "22px",
                        fontWeight: "700",
                        color: editingSlide.imageUrl ? "#ffffff" : "#111827",
                        margin: "0 0 8px",
                        lineHeight: "1.2",
                        textShadow: editingSlide.imageUrl ? "0 2px 10px rgba(0,0,0,0.5)" : "none",
                      }}
                    >
                      {editingSlide.title || "Headline Title"}
                    </h2>

                    <p
                      style={{
                        fontSize: "12px",
                        color: editingSlide.imageUrl ? "rgba(255,255,255,0.85)" : "#4b5563",
                        margin: "0 0 16px",
                        lineHeight: "1.5",
                      }}
                    >
                      {editingSlide.subtitle || "Subtitle description..."}
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                      <span
                        style={{
                          padding: "8px 18px",
                          borderRadius: "3px",
                          background: editingSlide.imageUrl ? "#c59b27" : "#0d4428",
                          color: editingSlide.imageUrl ? "#072818" : "#fff",
                          fontSize: "10px",
                          fontWeight: "800",
                          letterSpacing: "1.5px",
                        }}
                      >
                        {editingSlide.ctaText || "EXPLORE COLLECTION"}
                      </span>
                      {editingSlide.ctaSecondaryText && (
                        <span
                          style={{
                            padding: "8px 18px",
                            borderRadius: "3px",
                            background: "rgba(255,255,255,0.2)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.5)",
                            fontSize: "10px",
                            fontWeight: "800",
                            letterSpacing: "1.5px",
                          }}
                        >
                          {editingSlide.ctaSecondaryText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px", borderTop: "1px solid #ede7e1", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlide}
                  style={{
                    padding: "8px 24px",
                    borderRadius: "4px",
                    background: "#0d4428",
                    color: "#f5d77f",
                    border: "1px solid #c59b27",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: savingSlide ? "not-allowed" : "pointer",
                  }}
                >
                  {savingSlide ? "Saving..." : "✓ Save Hero Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
