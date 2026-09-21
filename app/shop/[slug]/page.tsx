"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { useToast } from "@/app/context/ToastContext";
import {
  BagIcon,
  HeartIcon,
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SparklesIcon,
  ShareIcon,
  FilmIcon,
  CameraIcon,
  ZapIcon,
  FlameIcon,
  CreditCardIcon,
  MessageSquareIcon,
} from "@/app/components/Icons";
import TryOnModal from "@/app/components/TryOnModal";
import ProductReviews from "@/app/components/ProductReviews";
import ProductInquiryModal from "@/app/components/ProductInquiryModal";
import CompleteTheLook from "@/app/components/CompleteTheLook";
import { appConfig } from "@/lib/config";
import { trackMetaEvent } from "@/lib/meta-pixel";

type ProductImage = {
  id?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
  color?: string | null;
};

type ProductVariant = {
  id: string;
  size: string;
  color?: string | null;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  salePrice?: number | string | null;
  description?: string | null;
  sku?: string;
  videoUrl?: string | null;
  category?: {
    name: string;
    slug?: string;
  } | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
};

function getEmbedVideoInfo(url: string): { isIframe: boolean; src: string } {
  if (!url) return { isIframe: false, src: "" };
  const clean = url.trim();

  // YouTube match
  const ytMatch = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      isIframe: true,
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`,
    };
  }

  // Vimeo match
  const vimeoMatch = clean.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      isIframe: true,
      src: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&muted=1&playsinline=1`,
    };
  }

  return { isIframe: false, src: clean };
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const { addToCart, cart, removeFromCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [activeMedia, setActiveMedia] = useState<"image" | "video">("image");
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  // Accordion state
  const [openSection, setOpenSection] = useState<string | null>("details");

  useEffect(() => {
    async function loadProductData() {
      try {
        setLoading(true);
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load products");
        const list: Product[] = await response.json();
        setAllProducts(list);

        const found = list.find((item) => item.slug === slug);
        setProduct(found || null);

        if (found) {
          trackMetaEvent("ViewContent", {
            content_name: found.name,
            content_category: found.category?.name || "Luxury Indian Couture",
            content_ids: [found.sku || found.id],
            content_type: "product",
            value: Number(found.salePrice || found.price) || 0,
            currency: "INR",
          });
        }

        if (found?.variants && found.variants.length > 0) {
          const firstInStock = found.variants.find((v) => v.stock > 0);
          if (firstInStock) {
            setSelectedSize(firstInStock.size);
            if (firstInStock.color) setSelectedColor(firstInStock.color);
          } else {
            setSelectedSize(found.variants[0].size);
            if (found.variants[0].color) setSelectedColor(found.variants[0].color);
          }
        }
      } catch (err) {
        console.error("LOAD PRODUCT ERROR:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      void loadProductData();
    }
  }, [slug]);

  const variants = useMemo(() => product?.variants || [], [product]);
  const allImages = useMemo(() => product?.images || [], [product]);

  // Extract distinct colors
  const colors = useMemo(() => {
    return Array.from(
      new Set(
        variants
          .map((v) => v.color?.trim())
          .filter((c): c is string => Boolean(c))
      )
    );
  }, [variants]);

  // Filter gallery images by color if applicable
  const galleryImages = useMemo(() => {
    if (!selectedColor || colors.length === 0) return allImages;

    const matched = allImages.filter(
      (img) =>
        img.color?.trim().toLowerCase() === selectedColor.trim().toLowerCase()
    );
    const unassigned = allImages.filter(
      (img) => !img.color || img.color.trim() === ""
    );

    if (matched.length > 0) {
      return [...matched, ...unassigned];
    }
    return allImages;
  }, [allImages, selectedColor, colors]);

  const currentImage = galleryImages[selectedImageIdx] || galleryImages[0];

  // Available sizes for the chosen color
  const variantsForColor = useMemo(() => {
    if (selectedColor && colors.length > 0) {
      return variants.filter(
        (v) =>
          v.color?.trim().toLowerCase() === selectedColor.trim().toLowerCase()
      );
    }
    return variants;
  }, [variants, selectedColor, colors]);

  const availableSizes = useMemo(() => {
    return Array.from(new Set(variantsForColor.map((v) => v.size)));
  }, [variantsForColor]);

  const activeVariant = useMemo(() => {
    return variants.find((v) => {
      const matchSize = v.size === selectedSize;
      const matchColor =
        !selectedColor ||
        v.color?.trim().toLowerCase() === selectedColor.trim().toLowerCase();
      return matchSize && matchColor;
    });
  }, [variants, selectedSize, selectedColor]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  if (loading) {
    return (
      <main className="product-detail-wrapper" style={{ textAlign: "center", padding: "120px 20px" }}>
        <p style={{ fontSize: "14px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--brand-rose)" }}>
          PQN ATELIER
        </p>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", marginTop: "10px" }}>
          Loading Haute Couture Design...
        </h2>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-detail-wrapper">
        <div className="empty-state-card">
          <h2>Product Not Found</h2>
          <p style={{ margin: "14px 0 24px" }}>
            The requested design is currently unavailable or has been archived.
          </p>
          <Link href="/shop" className="btn-primary">
            RETURN TO SHOP
          </Link>
        </div>
      </main>
    );
  }

  const originalPrice = Number(product.price);
  const salePrice =
    product.salePrice !== null && product.salePrice !== undefined
      ? Number(product.salePrice)
      : originalPrice;

  const hasSale = salePrice < originalPrice;
  const discount = hasSale
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const isFav = isWishlisted(product.id);
  const isAdded = cart.some(
    (item) =>
      item.id === product.id &&
      item.size === (selectedSize || "Free Size") &&
      item.color === (selectedColor || "")
  );

  function handleAddBag() {
    if (!product) return;

    if (variants.length > 0 && !selectedSize) {
      showToast("Please choose your size first.", { type: "info" });
      return;
    }

    if (activeVariant && activeVariant.stock <= 0) {
      showToast("Selected size/color is out of stock.", { type: "error" });
      return;
    }

    const currentSize = selectedSize || "Free Size";
    const currentColor = selectedColor || "";

    if (isAdded) {
      removeFromCart(product.id, currentSize, currentColor);
      showToast(`Removed ${product.name} from your shopping bag`, { type: "info" });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: salePrice,
      image: currentImage?.url || allImages[0]?.url || "",
      size: currentSize,
      color: currentColor,
      quantity: 1,
    });

    showToast(`Added ${product.name} to your shopping bag`, {
      type: "cart",
      action: { label: "View Bag & Checkout", href: "/cart" },
    });
  }

  function handleShare() {
    if (!product) return;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Product link copied to clipboard!", { type: "success" });
    }
  }

  // Related items
  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category?.name === product.category?.name || !product.category)
    )
    .slice(0, 4);

  return (
    <main className="product-detail-wrapper">
      {/* BREADCRUMBS */}
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRightIcon size={12} />
        <Link href="/shop">Shop</Link>
        {product.category?.name && (
          <>
            <ChevronRightIcon size={12} />
            <Link href={`/shop?category=${product.category.slug || ""}`}>
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRightIcon size={12} />
        <span style={{ color: "var(--color-noir)", fontWeight: "500" }}>
          {product.name}
        </span>
      </nav>

      {/* 2-COLUMN MAIN PRODUCT LAYOUT */}
      <div className="product-detail-layout">
        {/* LEFT: GALLERY */}
        <div className="gallery-container">
          {/* Thumbnails */}
          {(galleryImages.length > 1 || product.videoUrl) && (
            <div className="thumbnails-column">
              {galleryImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  className={`thumbnail-btn ${activeMedia === "image" && selectedImageIdx === idx ? "active" : ""}`}
                  onClick={() => {
                    setActiveMedia("image");
                    setSelectedImageIdx(idx);
                  }}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img.url} alt={img.altText || product.name} />
                </button>
              ))}

              {/* Video Thumbnail Button */}
              {product.videoUrl && (
                <button
                  type="button"
                  className={`thumbnail-btn ${activeMedia === "video" ? "active" : ""}`}
                  onClick={() => setActiveMedia("video")}
                  aria-label="Play runway video"
                  style={{
                    position: "relative",
                    background: "#1c1917",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: "16px" }}>▶</span>
                  <span
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      left: "2px",
                      right: "2px",
                      background: "rgba(0,0,0,0.85)",
                      color: "var(--brand-rose)",
                      fontSize: "7px",
                      fontWeight: "800",
                      textAlign: "center",
                      borderRadius: "2px",
                      letterSpacing: "0.5px",
                    }}
                  >
                    RUNWAY
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Main Image / Video Display */}
          <div
            className="main-image-display"
            onMouseEnter={() => {
              if (activeMedia === "image") setZoomActive(true);
            }}
            onMouseLeave={() => setZoomActive(false)}
            onMouseMove={handleMouseMove}
            style={activeMedia === "video" ? { background: "#000" } : undefined}
          >
            {activeMedia === "video" ? (
              <div style={{ width: "100%", height: "100%", minHeight: "450px", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {(() => {
                  const activeVideo = product.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-traditional-indian-dress-39878-large.mp4";
                  const videoInfo = getEmbedVideoInfo(activeVideo);
                  if (videoInfo.isIframe) {
                    return (
                      <iframe
                        src={videoInfo.src}
                        title="Runway Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: "100%", height: "100%", minHeight: "450px", border: "none" }}
                      />
                    );
                  }
                  return (
                    <video
                      key={activeVideo}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "650px" }}
                    >
                      <source src={activeVideo} type="video/mp4" />
                      <source src={activeVideo} type="video/webm" />
                      Your browser does not support playing this video format directly.
                    </video>
                  );
                })()}
              </div>
            ) : currentImage?.url ? (
              <img
                src={currentImage.url}
                alt={currentImage.altText || product.name}
                style={
                  zoomActive
                    ? {
                        transform: "scale(2.2)",
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        transition: "transform 0.05s ease-out",
                      }
                    : {
                        transform: "scale(1)",
                        transformOrigin: "center",
                        transition: "transform 0.25s ease-out",
                      }
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-serif text-2xl text-stone-400">
                {product.category?.name || "PQN COUTURE"}
              </div>
            )}

            {/* Hover Hint */}
            {activeMedia === "image" && (
              <span
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(4px)",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontWeight: "600",
                  color: "#555",
                  pointerEvents: "none",
                }}
              >
                Hover to Zoom
              </span>
            )}

            {/* Watch Runway Video Overlay Trigger */}
            {activeMedia === "image" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMedia("video");
                }}
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  background: "rgba(7, 40, 24, 0.9)",
                  color: "#f5d77f",
                  backdropFilter: "blur(6px)",
                  padding: "7px 14px",
                  borderRadius: "24px",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "1.5px solid #c59b27",
                  cursor: "pointer",
                  zIndex: 5,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                  transition: "transform 0.2s ease",
                }}
              >
                <FilmIcon size={14} /> WATCH RUNWAY IN MOTION
              </button>
            )}

            {/* Back to Photos Overlay Button */}
            {activeMedia === "video" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMedia("image");
                }}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(28, 25, 23, 0.85)",
                  color: "#fff",
                  backdropFilter: "blur(6px)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  zIndex: 5,
                }}
              >
                <CameraIcon size={14} /> Back to Photos
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: DETAILS & ACTIONS */}
        <div className="product-meta-panel">
          {product.category?.name && (
            <span className="product-detail-category">
              {product.category.name}
            </span>
          )}

          <h1 className="product-detail-title">{product.name}</h1>

          {/* RATING BADGE */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0 16px" }}>
            <div style={{ color: "#eab308", fontSize: "14px", letterSpacing: "1px" }}>★★★★★</div>
            <a
              href="#reviews-section"
              style={{
                fontSize: "12px",
                color: "var(--color-text-muted)",
                textDecoration: "underline",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              4.9 (Client Testimonials)
            </a>
          </div>

          {/* PRICE ROW */}
          <div className="product-detail-price-row">
            <span className="product-detail-price">
              ₹{salePrice.toLocaleString("en-IN")}
            </span>
            {hasSale && (
              <span className="product-original-price" style={{ fontSize: "16px" }}>
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            {discount > 0 && (
              <span className="product-discount-tag" style={{ fontSize: "12px", padding: "4px 10px" }}>
                SAVE {discount}%
              </span>
            )}
          </div>

          <p style={{ color: "var(--color-text-muted)", fontSize: "15px", lineHeight: "1.7" }}>
            {product.description ||
              "Handcrafted with royal elegance, delicate embroidery, and flattering silhouette tailored for wedding celebrations and evening galas."}
          </p>

          {/* COLOR SWATCHES */}
          {colors.length > 0 && (
            <div className="swatch-group">
              <h4>
                <span>Color</span>
                <strong>{selectedColor || "Select Color"}</strong>
              </h4>
              <div className="color-swatches">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch-btn ${selectedColor === c ? "active" : ""}`}
                    onClick={() => {
                      setSelectedColor(c);
                      setSelectedImageIdx(0);
                    }}
                  >
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: c.toLowerCase(),
                        border: "1px solid rgba(0,0,0,0.15)",
                        display: "inline-block",
                      }}
                    />
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SIZES SELECTOR */}
          {variants.length > 0 && (
            <div className="size-group">
              <h4>
                <span>Select Size</span>
                <strong>{selectedSize || "Select a Size"}</strong>
              </h4>
              <div className="size-selector-grid">
                {availableSizes.map((size) => {
                  const variant = variantsForColor.find((v) => v.size === size);
                  const inStock = Boolean(variant && variant.stock > 0);

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!inStock}
                      className={`size-btn ${selectedSize === size ? "active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STOCK STATUS BADGE */}
          {activeVariant && (
            <div style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              {activeVariant.stock > 0 ? (
                activeVariant.stock <= 5 ? (
                  <span style={{ color: "#d97706", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FlameIcon size={14} /> Hurry, only {activeVariant.stock} left in stock!
                  </span>
                ) : (
                  <span style={{ color: "#15803d", fontWeight: "600" }}>
                    ✓ In Stock & Ready to Dispatch
                  </span>
                )
              ) : (
                <span style={{ color: "#b91c1c", fontWeight: "600" }}>
                  ✕ Currently Out of Stock
                </span>
              )}
            </div>
          )}

          {/* VIRTUAL TRY-ON TRIGGER */}
          {appConfig.ai.enableVirtualTryOn && (
            <button
              type="button"
              onClick={() => setTryOnOpen(true)}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: "4px",
                border: "1.5px solid var(--brand-rose)",
                background: "linear-gradient(135deg, #fff1f4 0%, #ffffff 100%)",
                color: "var(--brand-rose)",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "1.2px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(155, 77, 101, 0.12)",
                marginBottom: "12px",
                transition: "transform 0.15s ease",
              }}
            >
              <SparklesIcon size={16} /> AI VIRTUAL TRY-ON (SEE ON YOU)
            </button>
          )}

          {/* REAL-TIME LOW STOCK ALERT */}
          {activeVariant && activeVariant.stock > 0 && activeVariant.stock <= 5 && (
            <div style={{ padding: "8px 12px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "4px", color: "#92400e", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
              <ZapIcon size={14} /> Only {activeVariant.stock} handcrafted {activeVariant.stock === 1 ? "piece" : "pieces"} left in size {selectedSize} — order soon!
            </div>
          )}

          {/* CTA ACTION BUTTONS */}
          <div className="product-action-cta-group" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn-add-bag"
                style={{ flex: 1 }}
                disabled={Boolean(activeVariant && activeVariant.stock <= 0)}
                onClick={handleAddBag}
              >
                {isAdded ? (
                  <>
                    <CheckIcon size={18} /> IN YOUR BAG
                  </>
                ) : (
                  <>
                    <BagIcon size={18} /> ADD TO SHOPPING BAG
                  </>
                )}
              </button>

              {appConfig.features.enableWishlist && (
                <button
                  type="button"
                  className={`btn-wishlist-detail ${isFav ? "active" : ""}`}
                  onClick={() => {
                    toggleWishlist({
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: salePrice,
                      image: currentImage?.url || allImages[0]?.url || "",
                    });
                    showToast(
                      isFav
                        ? `Removed ${product.name} from wishlist`
                        : `Saved ${product.name} to wishlist`,
                      {
                        type: "wishlist",
                        action: { label: "View Wishlist", href: "/wishlist" },
                      }
                    );
                  }}
                  aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <HeartIcon size={20} filled={isFav} />
                </button>
              )}

              <button
                type="button"
                className="btn-wishlist-detail"
                onClick={handleShare}
                aria-label="Share product"
              >
                <ShareIcon size={18} />
              </button>
            </div>

            {/* 1-CLICK EXPRESS BUY NOW */}
            <button
              type="button"
              onClick={() => {
                if (!isAdded) {
                  handleAddBag();
                }
                router.push("/checkout");
              }}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: "4px",
                background: "linear-gradient(135deg, #c59b27, #f5d77f)",
                color: "#072818",
                border: "none",
                fontSize: "13px",
                fontWeight: "900",
                letterSpacing: "1px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(197, 155, 39, 0.25)",
              }}
            >
              <ZapIcon size={14} /> 1-CLICK EXPRESS BUY NOW
            </button>
          </div>

          {/* BUY NOW PAY LATER (BNPL) PREVIEW */}
          <div style={{ marginTop: "12px", padding: "10px 14px", background: "#f6f9f7", borderRadius: "6px", border: "1px solid #d4e2d8", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px" }}>
            <span style={{ color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
              <CreditCardIcon size={14} /> Or <strong>3 interest-free payments</strong> of <strong>₹{Math.round(salePrice / 3).toLocaleString("en-IN")}/mo</strong>
            </span>
            <span style={{ fontWeight: "800", color: "#0d4428", background: "#e5ede8", padding: "2px 6px", borderRadius: "4px" }}>
              Klarna / SplitPay
            </span>
          </div>

          {/* INQUIRY & BESPOKE CTA */}
          {appConfig.features.enableInquiries && (
            <button
              type="button"
              onClick={() => setInquiryOpen(true)}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "11px 16px",
                borderRadius: "4px",
                border: "1px solid var(--border-medium)",
                background: "#fafaf9",
                color: "var(--color-noir)",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "0.5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <MessageSquareIcon size={14} /> ASK INQUIRY / CUSTOM FITTING CONSULTATION
            </button>
          )}

          {/* TRUST BADGES ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              padding: "18px 0",
              borderTop: "1px solid var(--border-subtle)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              <TruckIcon size={20} className="text-stone-700" />
              <span>Free Express Shipping</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              <RefreshCwIcon size={20} className="text-stone-700" />
              <span>7-Day Easy Exchange</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
              <ShieldCheckIcon size={20} className="text-stone-700" />
              <span>100% Handcrafted</span>
            </div>
          </div>

          {/* PRODUCT ACCORDIONS */}
          <div className="product-accordions">
            {/* Details */}
            <div className="accordion-item">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() =>
                  setOpenSection(openSection === "details" ? null : "details")
                }
              >
                <span>Product Specifications</span>
                <ChevronDownIcon
                  size={16}
                  style={{
                    transform: openSection === "details" ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
              {openSection === "details" && (
                <div className="accordion-content">
                  <p>• <strong>SKU:</strong> {product.sku || "PQN-LUX-01"}</p>
                  <p>• <strong>Category:</strong> {product.category?.name || "Party Couture"}</p>
                  <p>• <strong>Occasion:</strong> Weddings, Sangeet, Receptions, Festive Parties</p>
                  <p>• <strong>Craftsmanship:</strong> Artisanal zari embroidery & fine tailoring</p>
                </div>
              )}
            </div>

            {/* Fabric & Care */}
            <div className="accordion-item">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() =>
                  setOpenSection(openSection === "care" ? null : "care")
                }
              >
                <span>Fabric & Care Guide</span>
                <ChevronDownIcon
                  size={16}
                  style={{
                    transform: openSection === "care" ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
              {openSection === "care" && (
                <div className="accordion-content">
                  <p>• <strong>Material:</strong> Premium Georgette / Raw Silk blend with crepe lining.</p>
                  <p>• <strong>Wash Care:</strong> Dry clean only. Do not machine wash or bleach.</p>
                  <p>• <strong>Ironing:</strong> Low temperature steam press inside-out.</p>
                </div>
              )}
            </div>

            {/* Delivery & Returns */}
            <div className="accordion-item">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() =>
                  setOpenSection(openSection === "shipping" ? null : "shipping")
                }
              >
                <span>Shipping & Returns</span>
                <ChevronDownIcon
                  size={16}
                  style={{
                    transform: openSection === "shipping" ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
              {openSection === "shipping" && (
                <div className="accordion-content">
                  <p>• Orders dispatched within 24-48 business hours with live tracking link.</p>
                  <p>• Delivered in 3-5 working days across major Indian metros.</p>
                  <p>• Easy 7-day exchange policy for size and fit alterations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETE THE LOOK STYLIST CURATION */}
      {product && (
        <CompleteTheLook
          mainProductName={product.name}
          mainProductPrice={salePrice}
        />
      )}

      {/* VERIFIED CUSTOMER REVIEWS & RATINGS */}
      {product && (
        <ProductReviews
          productId={product.id}
          productName={product.name}
        />
      )}

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: "100px", paddingTop: "60px", borderTop: "1px solid var(--border-subtle)" }}>
          <div className="section-heading" style={{ marginBottom: "36px" }}>
            <span className="section-eyebrow">COMPLETE YOUR LOOK</span>
            <h2>You May Also Adore</h2>
          </div>

          <div className="product-grid">
            {relatedProducts.map((rel) => {
              const rOrig = Number(rel.price);
              const rSale = rel.salePrice ? Number(rel.salePrice) : rOrig;

              return (
                <article key={rel.id} className="product-card">
                  <div className="product-card-image">
                    <Link href={`/shop/${rel.slug}`} className="block w-full h-full">
                      {rel.images?.[0]?.url ? (
                        <img src={rel.images[0].url} alt={rel.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-stone-400">
                          {rel.category?.name || "PQN"}
                        </div>
                      )}
                    </Link>
                  </div>
                  <div className="product-card-body">
                    <Link href={`/shop/${rel.slug}`}>
                      <h3 className="product-card-title">{rel.name}</h3>
                    </Link>
                    <div className="product-card-prices">
                      <span className="product-current-price">
                        ₹{rSale.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* SCHEMA.ORG PRODUCT & BREADCRUMB JSON-LD FOR SEO */}
      {product && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": product.name,
                "image": allImages.map((img) => img.url),
                "description": product.description || `Handcrafted ${product.name} by PQN Party Queen Atelier.`,
                "sku": product.sku || product.slug,
                "brand": {
                  "@type": "Brand",
                  "name": "PQN PARTY QUEEN"
                },
                "offers": {
                  "@type": "Offer",
                  "url": `https://pqnpartyqueen.com/shop/${product.slug}`,
                  "priceCurrency": "INR",
                  "price": salePrice,
                  "priceValidUntil": "2028-12-31",
                  "itemCondition": "https://schema.org/NewCondition",
                  "availability": (activeVariant ? activeVariant.stock > 0 : true) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  "seller": {
                    "@type": "Organization",
                    "name": "PQN PARTY QUEEN"
                  }
                },
                "category": product.category?.name || "Luxury Ethnic Wear"
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://pqnpartyqueen.com"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": product.category?.name || "Shop",
                    "item": `https://pqnpartyqueen.com/shop?category=${product.category?.slug || ""}`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": product.name,
                    "item": `https://pqnpartyqueen.com/shop/${product.slug}`
                  }
                ]
              }),
            }}
          />
        </>
      )}

      {/* VIRTUAL TRY-ON FITTING MODAL */}
      {product && (
        <TryOnModal
          isOpen={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            salePrice: product.salePrice,
            image: currentImage?.url || allImages[0]?.url || "",
            category: product.category?.name || undefined,
            description: product.description || undefined,
            sizes: availableSizes,
            color: selectedColor || undefined,
          }}
        />
      )}

      {/* BESPOKE INQUIRY MODAL */}
      {product && (
        <ProductInquiryModal
          isOpen={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            price: salePrice,
            image: currentImage?.url || allImages[0]?.url || "",
          }}
        />
      )}
    </main>
  );
}