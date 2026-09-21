"use client";

import React, { FormEvent, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/app/components/AdminLayout";
import {
  SparklesIcon,
  LayersIcon,
  TrashIcon,
} from "@/app/components/Icons";
import { useToast } from "@/app/context/ToastContext";
import { uploadOptimizedImage } from "@/lib/image-upload-client";
import "@/app/admin/products/new/new-product.css";

type Category = {
  id: string;
  name: string;
};

type Variant = {
  id?: string;
  size: string;
  color: string;
  stock: string;
};

type ImageItem = {
  id?: string;
  url: string;
  altText: string;
  color?: string;
  uploading?: boolean;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Form fields
  const [name, setName] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT" | "ARCHIVED">("ACTIVE");

  const [images, setImages] = useState<ImageItem[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState<number>(0);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Shipping & Parcel Dimensions (iThink Logistics)
  const [weight, setWeight] = useState<string>("0.8");
  const [length, setLength] = useState<string>("30");
  const [width, setWidth] = useState<string>("25");
  const [height, setHeight] = useState<string>("8");

  useEffect(() => {
    async function loadData() {
      if (!productId) return;

      try {
        setLoading(true);
        setError("");

        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${productId}`),
          fetch("/api/admin/categories"),
        ]);

        if (!prodRes.ok) {
          throw new Error("Failed to load product details.");
        }

        const prodData = await prodRes.json();
        const p = prodData.product;

        setName(p.name || "");
        setSku(p.sku || "");
        setSlug(p.slug || "");
        setDescription(p.description || "");
        setCategoryId(p.categoryId || "");
        setPrice(String(p.price || ""));
        setSalePrice(p.salePrice ? String(p.salePrice) : "");
        setWeight(p.weight !== undefined && p.weight !== null ? String(p.weight) : "0.8");
        setLength(p.length !== undefined && p.length !== null ? String(p.length) : "30");
        setWidth(p.width !== undefined && p.width !== null ? String(p.width) : "25");
        setHeight(p.height !== undefined && p.height !== null ? String(p.height) : "8");
        setStatus(p.status || "ACTIVE");
        setVideoUrl(p.videoUrl || "");

        if (p.images && p.images.length > 0) {
          setImages(
            p.images.map((img: any) => ({
              id: img.id,
              url: img.url,
              altText: img.altText || "",
              color: img.color || "",
            }))
          );
        } else {
          setImages([{ url: "", altText: "", color: "" }]);
        }

        if (p.variants && p.variants.length > 0) {
          setVariants(
            p.variants.map((v: any) => ({
              id: v.id,
              size: v.size,
              color: v.color || "",
              stock: String(v.stock ?? 0),
            }))
          );
        } else {
          setVariants([{ size: "FREE SIZE", color: "", stock: "10" }]);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : catData.categories || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load product data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId]);

  // Multi-Image Fast Upload (Client-Side Compression + Cloud Storage)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    const fileList = Array.from(files);

    for (const file of fileList) {
      if (file.size > 20 * 1024 * 1024) {
        showToast(`File ${file.name} is larger than 20MB.`, { type: "error" });
        continue;
      }

      const tempPreviewUrl = URL.createObjectURL(file);
      const altText = file.name.replace(/\.[^/.]+$/, "");

      // Immediately show placeholder with spinner
      setImages((prev) => [
        ...prev.filter((i) => i.url.trim().length > 0),
        {
          url: tempPreviewUrl,
          altText,
          color: "",
          uploading: true,
        },
      ]);
      setUploadingCount((c) => c + 1);

      // Rapidly compress in browser & upload to Supabase CDN
      uploadOptimizedImage(file)
        .then((cloudUrl) => {
          setImages((prev) =>
            prev.map((img) =>
              img.url === tempPreviewUrl
                ? { ...img, url: cloudUrl, uploading: false }
                : img
            )
          );
          showToast(`Uploaded ${file.name} to cloud storage`, { type: "success" });
        })
        .catch((uploadErr: any) => {
          console.error("Upload error for file:", file.name, uploadErr);
          setImages((prev) => prev.filter((img) => img.url !== tempPreviewUrl));
          showToast(`Failed to upload ${file.name}: ${uploadErr.message || "Network error"}`, { type: "error" });
        })
        .finally(() => {
          setUploadingCount((c) => Math.max(0, c - 1));
        });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleAddManualUrl() {
    if (!manualImageUrl.trim()) return;
    setImages((prev) => [
      ...prev.filter((i) => i.url.trim().length > 0),
      {
        url: manualImageUrl.trim(),
        altText: name || "Product Media",
        color: "",
      },
    ]);
    setManualImageUrl("");
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function setCoverImage(idx: number) {
    setImages((prev) => {
      const target = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [target, ...rest];
    });
    showToast("Set as primary cover image", { type: "info" });
  }

  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Video Upload Handler (Fast Base64 JSON)
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 60 * 1024 * 1024) {
      setError(`Video file ${file.name} exceeds 60MB limit.`);
      return;
    }

    try {
      setUploadingVideo(true);
      setError("");

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileData = await base64Promise;

      const res = await fetch("/api/admin/products/upload-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData,
          fileName: file.name,
          fileType: file.type || "video/mp4",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload video.");
      }

      setVideoUrl(data.url);
      showToast("Runway video uploaded & attached successfully!", { type: "success" });
    } catch (err: any) {
      setError(err.message || "Failed to upload video.");
    } finally {
      setUploadingVideo(false);
    }
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      { size: "", color: prev[prev.length - 1]?.color || "", stock: "5" },
    ]);
  }

  function removeVariant(idx: number) {
    if (variants.length <= 1) {
      setError("Product must have at least one size variant.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateVariant(idx: number, field: keyof Variant, val: string) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v))
    );
  }

  const regPriceNum = Number(price) || 0;
  const salePriceNum = Number(salePrice) || 0;
  const discountPercent =
    regPriceNum > 0 && salePriceNum > 0 && salePriceNum < regPriceNum
      ? Math.round(((regPriceNum - salePriceNum) / regPriceNum) * 100)
      : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!sku.trim()) {
      setError("SKU is required.");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (salePrice && Number(salePrice) > Number(price)) {
      setError("Sale price cannot exceed the regular price.");
      return;
    }

    if (!weight || Number(weight) <= 0) {
      setError("Please specify a valid product weight greater than 0 kg (e.g. 0.8 kg) for logistics calculations.");
      return;
    }

    if (!length || Number(length) <= 0 || !width || Number(width) <= 0 || !height || Number(height) <= 0) {
      setError("Please specify valid package dimensions (Length, Width, Height > 0 cm).");
      return;
    }

    const validImages = images.filter((img) => img.url.trim().length > 0);
    if (validImages.length === 0) {
      setError("Please include at least one product photo.");
      return;
    }

    const validVariants = variants.filter((v) => v.size.trim().length > 0);
    if (validVariants.length === 0) {
      setError("Please define at least one valid variant.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim(),
        description: description.trim() || null,
        videoUrl: videoUrl.trim() || null,
        categoryId,
        price: String(Number(price)),
        salePrice: salePrice ? String(Number(salePrice)) : null,
        weight: String(Number(weight)),
        length: String(Number(length)),
        width: String(Number(width)),
        height: String(Number(height)),
        status,
        images: validImages.map((img, idx) => ({
          url: img.url.trim(),
          altText: img.altText?.trim() || null,
          color: img.color?.trim() || null,
          sortOrder: idx,
        })),
        variants: validVariants.map((v) => ({
          size: v.size.trim(),
          color: v.color?.trim() || null,
          stock: Math.max(0, parseInt(v.stock, 10) || 0),
        })),
      };

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product.");
      }

      showToast(`Updated "${name}" successfully!`, { type: "success" });
      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message || "Failed to save product changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Product Atelier Studio">
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--color-text-muted)" }}>
          Loading ensemble dossier from atelier database...
        </div>
      </AdminLayout>
    );
  }

  const selectedCategoryName =
    categories.find((c) => c.id === categoryId)?.name || "Haute Couture";
  const coverImage = images[0]?.url || "";

  return (
    <AdminLayout title="Product Atelier Studio">
      <div className="admin-product-studio">
        {/* TOP COMMAND BAR */}
        <div className="admin-studio-topbar">
          <div className="admin-studio-breadcrumbs">
            <Link href="/admin/products" className="admin-studio-back-link">
              ← Products Catalog
            </Link>
            <span>/</span>
            <span>Edit Ensemble #{sku}</span>
          </div>

          <div className="admin-studio-actions">
            <Link
              href={`/shop/${slug}`}
              target="_blank"
              style={{
                padding: "8px 14px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                background: "#fafaf9",
                color: "var(--color-noir)",
                fontSize: "12px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              View on Storefront ↗
            </Link>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById("edit-product-form") as HTMLFormElement;
                form?.requestSubmit();
              }}
              disabled={saving || uploadingCount > 0}
              className="btn-primary"
              style={{ padding: "8px 22px", fontSize: "12px", letterSpacing: "1px" }}
            >
              {saving
                ? "SAVING CHANGES..."
                : uploadingCount > 0
                ? `UPLOADING PHOTOS (${uploadingCount})...`
                : "SAVE CHANGES"}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "6px",
              fontSize: "13px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        <form id="edit-product-form" onSubmit={handleSubmit}>
          <div className="admin-studio-grid">
            {/* LEFT MAIN COLUMN */}
            <div className="admin-studio-main-col">
              {/* CARD 1: GENERAL INFORMATION */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">
                      <SparklesIcon size={16} style={{ color: "var(--brand-rose)" }} />
                      Ensemble Details & Story
                    </h2>
                    <p className="admin-card-subtitle">
                      Title, editorial description, and SKU classification
                    </p>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Product Ensemble Title *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">SKU Code *</label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">URL Slug *</label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Editorial Description & Craftsmanship Story</label>
                  <textarea
                    rows={4}
                    className="admin-form-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* CARD 2: MEDIA & GALLERY */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">
                      <LayersIcon size={16} style={{ color: "var(--brand-rose)" }} />
                      Lookbook & High-Res Gallery ({images.length})
                    </h2>
                    <p className="admin-card-subtitle">
                      Upload high-resolution photos or paste hosted image URLs. First image is the catalog cover.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
                <div
                  className="admin-media-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#fff",
                      border: "1px solid var(--border-medium)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    📸
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--color-noir)", display: "block" }}>
                      Click to upload new photos from your device
                    </strong>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      Supports PNG, JPG, WEBP up to 15MB each
                    </span>
                  </div>
                </div>

                {/* Direct URL Input */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
                  <input
                    type="url"
                    placeholder="Or paste external image URL (https://...)"
                    className="admin-form-input"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddManualUrl}
                    style={{
                      padding: "0 16px",
                      borderRadius: "4px",
                      border: "1px solid var(--border-medium)",
                      background: "#fff",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Add URL
                  </button>
                </div>

                {/* Live Images Grid */}
                <div className="admin-media-grid">
                  {images.map((img, idx) => (
                    <div key={idx} className="admin-media-card" style={{ position: "relative" }}>
                      <img
                        src={img.url || "https://placehold.co/400x500?text=No+Photo"}
                        alt={img.altText || "Product"}
                        style={{ opacity: img.uploading ? 0.4 : 1, transition: "opacity 0.2s" }}
                      />
                      {img.uploading ? (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: "80px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0,0,0,0.4)",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 600,
                            gap: "6px",
                          }}
                        >
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              border: "2px solid #fff",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite",
                            }}
                          />
                          <span>Optimizing & Uploading...</span>
                        </div>
                      ) : (
                        <span className={`admin-media-card-badge ${idx === 0 ? "cover" : ""}`}>
                          {idx === 0 ? "⭐ Cover" : `#${idx + 1}`}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="admin-media-card-remove"
                        title="Remove image"
                      >
                        ✕
                      </button>

                      <div className="admin-media-card-meta">
                        <input
                          type="text"
                          placeholder="Alt tag (SEO)"
                          value={img.altText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setImages((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, altText: val } : it))
                            );
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Color swatch"
                          value={img.color || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setImages((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, color: val } : it))
                            );
                          }}
                        />
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => setCoverImage(idx)}
                            style={{
                              background: "#f5f5f4",
                              border: "1px solid #d6d3d1",
                              borderRadius: "3px",
                              fontSize: "9px",
                              fontWeight: "700",
                              padding: "2px",
                              cursor: "pointer",
                              color: "var(--brand-rose)",
                            }}
                          >
                            Set as Cover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD: RUNWAY & SHOWCASE VIDEO ASSET */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">
                      <span>🎥</span> Runway & Modelling Video Asset (Optional)
                    </h2>
                    <p className="admin-card-subtitle">
                      Attach high-fashion twirl clips, fabric drape, or runway videos (MP4, WEBM up to 50MB)
                    </p>
                  </div>
                </div>

                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  style={{ display: "none" }}
                  onChange={handleVideoUpload}
                />

                {videoUrl ? (
                  <div
                    style={{
                      background: "#1c1917",
                      borderRadius: "8px",
                      overflow: "hidden",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      border: "1px solid var(--border-medium)",
                    }}
                  >
                    <video
                      src={videoUrl}
                      controls
                      style={{
                        width: "100%",
                        maxHeight: "260px",
                        borderRadius: "4px",
                        background: "#000",
                        objectFit: "contain",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "700" }}>
                        ✓ Runway Video Attached & Ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setVideoUrl("")}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="admin-media-dropzone"
                      onClick={() => !uploadingVideo && videoFileInputRef.current?.click()}
                      style={{
                        marginBottom: "12px",
                        opacity: uploadingVideo ? 0.6 : 1,
                        cursor: uploadingVideo ? "wait" : "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "#fff",
                          border: "1px solid var(--border-medium)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                        }}
                      >
                        {uploadingVideo ? "⏳" : "🎬"}
                      </div>
                      <div>
                        <strong style={{ fontSize: "13px", color: "var(--color-noir)", display: "block" }}>
                          {uploadingVideo ? "Processing and uploading runway video..." : "Click to upload product video (MP4, WEBM)"}
                        </strong>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {uploadingVideo ? "Please wait a moment while the video is attaching..." : "Runway catwalks, 360 twirls, fabric textures up to 60MB"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="url"
                        placeholder="Or enter hosted video URL (https://.../runway.mp4)"
                        className="admin-form-input"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* CARD 3: PRICING */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">Pricing & Financial Valuation</h2>
                    <p className="admin-card-subtitle">
                      Set regular retail MRP and exclusive promotional prices
                    </p>
                  </div>
                </div>

                <div className="admin-form-row-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Regular MRP (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      className="admin-form-input"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Special Sale Price (₹ INR)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Optional"
                      className="admin-form-input"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                    />
                  </div>
                </div>

                {discountPercent > 0 && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#166534",
                    }}
                  >
                    <span>
                      🎉 <strong>Promotional Discount:</strong> Customers save ₹
                      {(regPriceNum - salePriceNum).toLocaleString("en-IN")} ({discountPercent}% OFF)
                    </span>
                    <span style={{ fontWeight: "700", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px" }}>
                      ACTIVE SALE BADGE
                    </span>
                  </div>
                )}
              </div>

              {/* CARD: SHIPPING & PARCEL LOGISTICS (WEIGHT & DIMENSIONS) */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">
                      <LayersIcon size={16} style={{ color: "var(--brand-rose)" }} />
                      Shipping Package, Weight & Dimensions (iThink Logistics)
                    </h2>
                    <p className="admin-card-subtitle">
                      Mandatory individual product weight and package dimensions for accurate volumetric shipping calculations and AWB generation.
                    </p>
                  </div>
                </div>

                <div className="admin-form-row-2" style={{ marginBottom: "16px" }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Product Gross Weight (kg) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 0.80 (800 grams)"
                      className="admin-form-input"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                    <span className="admin-form-help">
                      e.g. 0.5 = 500g, 0.8 = 800g, 1.5 = 1.5kg, 2.5 = 2.5kg (Heavy Bridal Lehenga)
                    </span>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Estimated Volumetric Weight
                    </label>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#fafaf9",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "4px",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        Volumetric:{" "}
                        <strong style={{ color: "var(--brand-rose)" }}>
                          {((Number(length || 30) * Number(width || 25) * Number(height || 8)) / 5000).toFixed(2)} kg
                        </strong>
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Formula: (L×W×H)/5000</span>
                    </div>
                    <span className="admin-form-help">
                      Courier rates apply to the greater of Gross ({Number(weight || 0).toFixed(2)} kg) vs Volumetric
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Package Length (cm) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      placeholder="e.g. 30"
                      className="admin-form-input"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Package Width (cm) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      placeholder="e.g. 25"
                      className="admin-form-input"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Package Height (cm) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.5"
                      placeholder="e.g. 8"
                      className="admin-form-input"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* CARD 4: SIZES & VARIANTS */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2 className="admin-card-title">Sizing Matrix & Inventory Allocation</h2>
                    <p className="admin-card-subtitle">
                      Define available sizes, colors, and live warehouse inventory
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="btn-secondary"
                    style={{ padding: "4px 10px", fontSize: "11px" }}
                  >
                    + Add Single Size
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 40px",
                      gap: "10px",
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      color: "var(--color-text-muted)",
                      padding: "0 12px",
                    }}
                  >
                    <span>Size / Fitting *</span>
                    <span>Color / Hue</span>
                    <span>Stock Quantity *</span>
                    <span style={{ textAlign: "center" }}>Del</span>
                  </div>

                  {variants.map((v, idx) => (
                    <div key={idx} className="admin-variant-row">
                      <input
                        type="text"
                        required
                        className="admin-form-input"
                        style={{ height: "34px", fontSize: "12px" }}
                        value={v.size}
                        onChange={(e) => updateVariant(idx, "size", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="e.g. Ruby Red"
                        className="admin-form-input"
                        style={{ height: "34px", fontSize: "12px" }}
                        value={v.color}
                        onChange={(e) => updateVariant(idx, "color", e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        required
                        className="admin-form-input"
                        style={{ height: "34px", fontSize: "12px" }}
                        value={v.stock}
                        onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        style={{
                          height: "34px",
                          border: "1px solid #fecaca",
                          background: "#fff",
                          color: "#991b1b",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="admin-studio-sidebar-col">
              {/* STATUS */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">Catalog Visibility</h3>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Publishing Status</label>
                  <select
                    className="admin-form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="ACTIVE">🟢 Active (Live on Storefront)</option>
                    <option value="DRAFT">🟡 Draft (Atelier Internal Only)</option>
                    <option value="ARCHIVED">🔴 Archived (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* CATEGORY */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">Category & Collection</h3>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Primary Category *</label>
                  <select
                    className="admin-form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIVE MOCKUP */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3 className="admin-card-title">Live Storefront Preview</h3>
                </div>

                <div className="admin-preview-card">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={name || "Preview"}
                      className="admin-preview-image"
                    />
                  ) : (
                    <div
                      className="admin-preview-image"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        fontSize: "12px",
                      }}
                    >
                      No Image Added
                    </div>
                  )}

                  <div className="admin-preview-body">
                    <div className="admin-preview-category">{selectedCategoryName}</div>
                    <h4 className="admin-preview-name">
                      {name || "Untitled Royal Ensemble"}
                    </h4>
                    <div className="admin-preview-pricing">
                      {salePriceNum > 0 && salePriceNum < regPriceNum ? (
                        <>
                          <span className="admin-preview-sale">
                            ₹{salePriceNum.toLocaleString("en-IN")}
                          </span>
                          <span className="admin-preview-regular">
                            ₹{regPriceNum.toLocaleString("en-IN")}
                          </span>
                          <span className="admin-preview-discount">
                            {discountPercent}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="admin-preview-sale">
                          ₹{regPriceNum > 0 ? regPriceNum.toLocaleString("en-IN") : "0"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}