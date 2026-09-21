"use client";

import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import { PlusIcon, TrashIcon, EyeIcon, SparklesIcon, CheckIcon, CloseIcon } from "@/app/components/Icons";
import { ShowcaseCard } from "@/lib/showcase";
import { uploadOptimizedImage } from "@/lib/image-upload-client";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count?: {
    products: number;
  };
};

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<"showcase" | "taxonomy">("showcase");

  // Taxonomies State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Showcase Cards State
  const [showcaseCards, setShowcaseCards] = useState<ShowcaseCard[]>([]);
  const [loadingShowcase, setLoadingShowcase] = useState(true);

  // Showcase Modal State
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState<ShowcaseCard | null>(null);
  const [showcaseForm, setShowcaseForm] = useState({
    id: "",
    slug: "",
    label: "",
    name: "",
    desc: "",
    ribbon: "",
    tag: "",
    emoji: "👑",
    image: "",
    bgTone: "#f5f9f6",
    borderColor: "#cce2d3",
    pattern: "lattice" as "lattice" | "dots" | "lines" | "none",
  });
  const [savingShowcase, setSavingShowcase] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showcaseModalError, setShowcaseModalError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Taxonomy Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ----------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------
  async function loadCategories() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        throw new Error("Failed to load categories.");
      }
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  async function loadShowcaseCards() {
    try {
      setLoadingShowcase(true);
      const res = await fetch("/api/admin/showcase");
      if (res.ok) {
        const data = await res.json();
        setShowcaseCards(data.cards || []);
      }
    } catch (err: any) {
      console.warn("Failed to load showcase cards:", err);
    } finally {
      setLoadingShowcase(false);
    }
  }

  useEffect(() => {
    loadCategories();
    loadShowcaseCards();
  }, []);

  // ----------------------------------------------------
  // SHOWCASE MODAL HANDLERS
  // ----------------------------------------------------
  function handleOpenCreateShowcase() {
    setEditingShowcase(null);
    setShowcaseForm({
      id: `showcase-${Date.now()}`,
      slug: "new-category",
      label: "COLLECTION",
      name: "New Luxury Collection",
      desc: "Artisanal handcrafted luxury ensemble",
      ribbon: "NEW IN",
      tag: "FEATURED",
      emoji: "✨",
      image: "",
      bgTone: "#faf8f3",
      borderColor: "#e8dfcc",
      pattern: "lattice",
    });
    setShowcaseModalError("");
    setIsShowcaseModalOpen(true);
  }

  function handleOpenEditShowcase(card: ShowcaseCard) {
    setEditingShowcase(card);
    setShowcaseForm({
      id: card.id,
      slug: card.slug,
      label: card.label || card.slug.toUpperCase(),
      name: card.name,
      desc: card.desc || "",
      ribbon: card.ribbon || "HAUTE",
      tag: card.tag || "FEATURED",
      emoji: card.emoji || "✨",
      image: card.image || "",
      bgTone: card.bgTone || "#f5f9f6",
      borderColor: card.borderColor || "#cce2d3",
      pattern: card.pattern || "lattice",
    });
    setShowcaseModalError("");
    setIsShowcaseModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setShowcaseModalError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    try {
      setUploadingImage(true);
      setShowcaseModalError("");

      const url = await uploadOptimizedImage(file, { maxWidth: 1600, quality: 0.85 });
      setShowcaseForm((prev) => ({ ...prev, image: url }));
    } catch (err: any) {
      console.error("Upload error in category showcase:", err);
      setShowcaseModalError(err?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSaveShowcase(e: React.FormEvent) {
    e.preventDefault();
    setShowcaseModalError("");
    setSavingShowcase(true);

    try {
      const url = editingShowcase
        ? `/api/admin/showcase/${editingShowcase.id}`
        : "/api/admin/showcase";
      const method = editingShowcase ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(showcaseForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save showcase card.");
      }

      setIsShowcaseModalOpen(false);
      await loadShowcaseCards();
    } catch (err: any) {
      setShowcaseModalError(err.message || "Failed to save.");
    } finally {
      setSavingShowcase(false);
    }
  }

  async function handleDeleteShowcase(id: string) {
    if (!confirm("Are you sure you want to delete this showcase card from the homepage?")) return;

    try {
      const res = await fetch(`/api/admin/showcase/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadShowcaseCards();
      }
    } catch (err: any) {
      alert("Failed to delete card.");
    }
  }

  // ----------------------------------------------------
  // TAXONOMY HANDLERS
  // ----------------------------------------------------
  function handleOpenCreate() {
    setEditingCategory(null);
    setForm({ name: "", slug: "", description: "", image: "" });
    setModalError("");
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat: Category) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
    });
    setModalError("");
    setIsModalOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    setModalError("");
    setSaving(true);

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save category.");
      }

      setIsModalOpen(false);
      await loadCategories();
    } catch (err: any) {
      setModalError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category.");
      }

      setDeleteTarget(null);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || "Could not delete category.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout
      title="Category & Showcase Management"
      actions={
        <div style={{ display: "flex", gap: "8px" }}>
          {activeTab === "showcase" ? (
            <button
              type="button"
              onClick={handleOpenCreateShowcase}
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "12px", background: "#0d4428", borderColor: "#c59b27", color: "#f5d77f" }}
            >
              <PlusIcon size={14} /> Add Showcase Card
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-primary"
              style={{ padding: "8px 14px", fontSize: "12px" }}
            >
              <PlusIcon size={14} /> Add Category
            </button>
          )}
        </div>
      }
    >
      {/* TABS NAVIGATION */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("showcase")}
          style={{
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "showcase" ? "2.5px solid #0d4428" : "2.5px solid transparent",
            color: activeTab === "showcase" ? "#0d4428" : "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🎴 Homepage Category Cards (Visual Editor)</span>
          <span style={{ fontSize: "11px", background: activeTab === "showcase" ? "#0d4428" : "#e5e7eb", color: activeTab === "showcase" ? "#f5d77f" : "#374151", padding: "1px 7px", borderRadius: "10px", fontWeight: "800" }}>
            {showcaseCards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("taxonomy")}
          style={{
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "taxonomy" ? "2.5px solid #0d4428" : "2.5px solid transparent",
            color: activeTab === "taxonomy" ? "#0d4428" : "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🏷️ Database Category Taxonomies</span>
          <span style={{ fontSize: "11px", background: activeTab === "taxonomy" ? "#0d4428" : "#e5e7eb", color: activeTab === "taxonomy" ? "#f5d77f" : "#374151", padding: "1px 7px", borderRadius: "10px", fontWeight: "800" }}>
            {categories.length}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: HOMEPAGE CATEGORY SHOWCASE CARDS VISUAL EDITOR       */}
      {/* ============================================================ */}
      {activeTab === "showcase" && (
        <div>
          {/* HEADER STRIP */}
          <div style={{ background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)", borderRadius: "8px", padding: "18px 24px", color: "#fff", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", border: "1px solid #c59b27" }}>
            <div>
              <strong style={{ fontSize: "15px", color: "#f5d77f", display: "block" }}>
                ✨ Homepage Showcase Visual Card Manager
              </strong>
              <span style={{ fontSize: "12px", color: "#d6cfc7" }}>
                Customize the background images, titles, subtitles, hanging ribbons, and badge tags for each card displayed on the storefront.
              </span>
            </div>
            <a
              href="/"
              target="_blank"
              style={{
                fontSize: "11px",
                fontWeight: "700",
                background: "rgba(255,255,255,0.15)",
                color: "#f5d77f",
                padding: "6px 14px",
                borderRadius: "4px",
                border: "1px solid rgba(197, 155, 39, 0.4)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <EyeIcon size={14} /> View Live Storefront
            </a>
          </div>

          {/* SHOWCASE CARDS GRID */}
          {loadingShowcase ? (
            <div style={{ padding: "40px", textAlign: "center" }}>Loading showcase cards...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {showcaseCards.map((card, idx) => (
                <div
                  key={card.id || card.slug}
                  style={{
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #e5ede8",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {/* CARD PREVIEW HEADER */}
                  <div
                    style={{
                      height: "140px",
                      position: "relative",
                      background: card.image ? "#072818" : (card.bgTone || "#f5f9f6"),
                      overflow: "hidden",
                      borderBottom: "1px solid #ede7e1",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "16px",
                    }}
                  >
                    {card.image ? (
                      <>
                        <img
                          src={card.image}
                          alt={card.name}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,40,24,0.3) 0%, rgba(7,40,24,0.85) 100%)" }} />
                      </>
                    ) : (
                      <div style={{ position: "absolute", inset: 0, opacity: 0.08, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px" }}>
                        {card.emoji || "✨"}
                      </div>
                    )}

                    {/* TOP BADGES */}
                    <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 3, display: "flex", gap: "6px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", background: "#072818", color: "#f5d77f", padding: "2px 8px", borderRadius: "10px", border: "1px solid #c59b27" }}>
                        🏷️ {card.ribbon || "RIBBON"}
                      </span>
                    </div>

                    <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 3 }}>
                      <span style={{ fontSize: "9px", fontWeight: "800", background: "#fef08a", color: "#854d0e", padding: "2px 8px", borderRadius: "10px" }}>
                        ★ {card.tag || "TAG"}
                      </span>
                    </div>

                    {/* MINI TITLE IN PREVIEW */}
                    <div style={{ position: "relative", zIndex: 3 }}>
                      <span style={{ fontSize: "9px", fontWeight: "800", color: "#f5d77f", letterSpacing: "1px", textTransform: "uppercase" }}>
                        {card.emoji} {card.label || card.slug}
                      </span>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: card.image ? "#ffffff" : "#111827", margin: "2px 0 0" }}>
                        {card.name}
                      </h4>
                    </div>
                  </div>

                  {/* CARD DETAILS BODY */}
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "12px", color: "#4b5563", margin: "0 0 10px", lineHeight: "1.4" }}>
                        {card.desc || "No subtitle provided."}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#6b7280", background: "#fafaf9", padding: "6px 10px", borderRadius: "4px" }}>
                        <span>🔗 Links to:</span>
                        <code style={{ color: "#0d4428", fontWeight: "700" }}>/shop?category={card.slug}</code>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "16px", borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditShowcase(card)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          borderRadius: "4px",
                          background: "#0d4428",
                          color: "#f5d77f",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          border: "1px solid #c59b27",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        ✏️ Edit Card & Image
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteShowcase(card.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "4px",
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          border: "1px solid #fecaca",
                          cursor: "pointer",
                        }}
                        title="Delete Card"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DATABASE TAXONOMIES                                   */}
      {/* ============================================================ */}
      {activeTab === "taxonomy" && (
        <div>
          {/* COMPACT SUMMARY STRIP */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "18px" }}>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px 16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Collections</span>
              <div style={{ fontSize: "20px", fontWeight: "700", margin: "2px 0" }}>{categories.length}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px 16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--brand-rose)", textTransform: "uppercase" }}>Catalog Groupings</span>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--brand-rose)", margin: "2px 0" }}>
                {categories.reduce((s, c) => s + (c._count?.products || 0), 0)} Linked Ensembles
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "12px 16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#15803d", textTransform: "uppercase" }}>Taxonomy Status</span>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#15803d", margin: "2px 0" }}>Live on Nav</div>
            </div>
          </div>

          {/* COMPACT CATEGORIES TABLE */}
          {loading ? (
            <div style={{ padding: "50px 20px", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>Loading collections...</h3>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", padding: "50px 20px", textAlign: "center" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}>No categories configured</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Create your first category grouping.</p>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "6px", overflowX: "auto", boxShadow: "var(--shadow-xs)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#fafaf9", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Collection</th>
                    <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>URL Slug</th>
                    <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Description</th>
                    <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>Products</th>
                    <th style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-text-muted)", fontSize: "10px", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "32px", height: "32px", borderRadius: "4px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#6b7280" }}>
                              📁
                            </div>
                          )}
                          <strong style={{ fontSize: "13px" }}>{cat.name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: "11px" }}>
                        {cat.slug}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--color-text-muted)", maxWidth: "240px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cat.description || "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                          {cat._count?.products || 0}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cat)}
                            style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid #fecaca", background: "#fee2e2", color: "#dc2626", cursor: "pointer" }}
                          >
                            <TrashIcon size={12} />
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
      )}

      {/* ============================================================ */}
      {/* SHOWCASE CARD EDIT / CREATE MODAL                           */}
      {/* ============================================================ */}
      {isShowcaseModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingShowcase) setIsShowcaseModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "760px",
              maxHeight: "92vh",
              background: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid #c59b27",
            }}
          >
            {/* MODAL HEADER */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #ede7e1", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#072818", color: "#f5d77f" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SparklesIcon size={18} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  {editingShowcase ? `Edit Card: ${editingShowcase.name}` : "Create Showcase Card"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShowcaseModalOpen(false)}
                style={{ background: "none", border: "none", color: "#f5d77f", cursor: "pointer" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleSaveShowcase} style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
              {showcaseModalError && (
                <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#dc2626", borderRadius: "4px", fontSize: "12px" }}>
                  {showcaseModalError}
                </div>
              )}

              {/* CARD TITLE & SUBTITLE */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Card Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={showcaseForm.name}
                    onChange={(e) => setShowcaseForm({ ...showcaseForm, name: e.target.value })}
                    placeholder="e.g. Bridal & Party Lehengas"
                    className="form-input"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Subtitle / Work Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={showcaseForm.desc}
                    onChange={(e) => setShowcaseForm({ ...showcaseForm, desc: e.target.value })}
                    placeholder="e.g. Intricate zari, sequin & gold threadwork"
                    className="form-input"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                  />
                </div>
              </div>

              {/* RIBBON, TAG & EMOJI */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Top Ribbon Banner
                  </label>
                  <input
                    type="text"
                    value={showcaseForm.ribbon}
                    onChange={(e) => setShowcaseForm({ ...showcaseForm, ribbon: e.target.value.toUpperCase() })}
                    placeholder="e.g. BRIDAL"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontWeight: "700" }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Badge Tag Pill
                  </label>
                  <input
                    type="text"
                    value={showcaseForm.tag}
                    onChange={(e) => setShowcaseForm({ ...showcaseForm, tag: e.target.value.toUpperCase() })}
                    placeholder="e.g. MOST LOVED"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontWeight: "700" }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Category URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={showcaseForm.slug}
                    onChange={(e) => setShowcaseForm({ ...showcaseForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    placeholder="e.g. lehengas"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "11.5px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Icon / Emoji
                  </label>
                  <input
                    type="text"
                    value={showcaseForm.emoji}
                    onChange={(e) => setShowcaseForm({ ...showcaseForm, emoji: e.target.value })}
                    placeholder="👑"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "16px", textAlign: "center" }}
                  />
                </div>
              </div>

              {/* BACKGROUND IMAGE UPLOADER */}
              <div style={{ background: "#fafaf9", border: "1.5px dashed #d1d5db", borderRadius: "6px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "800", color: "#0d4428" }}>
                    🖼️ Card Background Image (Lookbook Photo)
                  </label>
                  {showcaseForm.image && (
                    <button
                      type="button"
                      onClick={() => setShowcaseForm({ ...showcaseForm, image: "" })}
                      style={{ fontSize: "11px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={showcaseForm.image || ""}
                    onChange={(e) => setShowcaseForm({ ...showcaseForm, image: e.target.value })}
                    placeholder="Enter image URL or upload from device below..."
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

              {/* LIVE CARD PREVIEW IN MODAL */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#6b7280", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  👁️ Real-time Card Preview
                </span>

                <div
                  style={{
                    position: "relative",
                    borderRadius: "10px",
                    overflow: "hidden",
                    minHeight: "180px",
                    background: showcaseForm.image ? "#072818" : showcaseForm.bgTone,
                    border: "1px solid #c59b27",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                  }}
                >
                  {showcaseForm.image && (
                    <>
                      <img
                        src={showcaseForm.image}
                        alt="Preview"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,40,24,0.3) 0%, rgba(7,40,24,0.75) 50%, rgba(7,40,24,0.95) 100%)" }} />
                    </>
                  )}

                  {/* Ribbon in preview */}
                  {showcaseForm.ribbon && (
                    <div style={{ position: "absolute", top: "8px", left: "50%", transform: "translateX(-50%)", background: "#072818", color: "#f5d77f", padding: "3px 12px", borderRadius: "3px", border: "1px solid #c59b27", fontSize: "10px", fontWeight: "800", letterSpacing: "1px", zIndex: 3 }}>
                      {showcaseForm.ribbon}
                    </div>
                  )}

                  {/* Tag in preview */}
                  {showcaseForm.tag && (
                    <div style={{ position: "absolute", top: "10px", right: "12px", background: "#fef08a", color: "#854d0e", padding: "2px 8px", borderRadius: "10px", fontSize: "9px", fontWeight: "800", zIndex: 3 }}>
                      {showcaseForm.tag}
                    </div>
                  )}

                  <div style={{ position: "relative", zIndex: 3 }}>
                    <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                      {showcaseForm.emoji}
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "18px", color: showcaseForm.image ? "#ffffff" : "#111827", margin: "0 0 4px" }}>
                      {showcaseForm.name || "Card Title"}
                    </h3>
                    <p style={{ fontSize: "12px", color: showcaseForm.image ? "rgba(255,255,255,0.8)" : "#4a6350", margin: 0 }}>
                      {showcaseForm.desc || "Subtitle & Work Details"}
                    </p>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER ACTIONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px", borderTop: "1px solid #ede7e1", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  style={{ padding: "9px 18px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShowcase}
                  style={{
                    padding: "9px 24px",
                    borderRadius: "4px",
                    background: "#0d4428",
                    color: "#f5d77f",
                    border: "1px solid #c59b27",
                    fontSize: "12px",
                    fontWeight: "800",
                    cursor: savingShowcase ? "not-allowed" : "pointer",
                  }}
                >
                  {savingShowcase ? "Saving Changes..." : "✓ Save Showcase Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAXONOMY EDIT / CREATE MODAL                                */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "8px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>
              {editingCategory ? "Edit Category Taxonomy" : "Add Category Taxonomy"}
            </h3>

            <form onSubmit={handleSaveCategory} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {modalError && (
                <div style={{ padding: "8px 12px", background: "#fee2e2", color: "#dc2626", borderRadius: "4px", fontSize: "12px" }}>
                  {modalError}
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Category Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>URL Slug *</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "8px 18px", borderRadius: "4px", background: "#0d4428", color: "#f5d77f", border: "1px solid #c59b27", fontSize: "12px", fontWeight: "700" }}
                >
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{ width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "8px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#dc2626" }}>Delete Category?</h3>
            <p style={{ fontSize: "13px", color: "#4b5563", margin: "0 0 20px" }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCategory}
                style={{ padding: "8px 16px", borderRadius: "4px", background: "#dc2626", color: "#fff", border: "none", fontSize: "12px", fontWeight: "700" }}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
