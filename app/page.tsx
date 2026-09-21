"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { useToast } from "@/app/context/ToastContext";
import CategoryShowcase from "@/app/components/CategoryShowcase";
import {
  HeartIcon,
  BagIcon,
  CheckIcon,
  ArrowRightIcon,
  TruckIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  SparklesIcon,
  TagIcon,
} from "@/app/components/Icons";

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
  status?: string;
  createdAt?: string;
  description?: string | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  images?: {
    id: string;
    url: string;
    altText?: string | null;
    sortOrder?: number;
  }[];
  variants?: ProductVariant[];
};

/* ==========================================================================
   PRODUCT CARD COMPONENT
   ========================================================================== */

function ProductCard({
  product,
  badge,
}: {
  product: Product;
  badge?: string;
}) {
  const { cart, addToCart, removeFromCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const originalPrice = Number(product.price);
  const salePrice =
    product.salePrice !== null && product.salePrice !== undefined
      ? Number(product.salePrice)
      : originalPrice;

  const hasSale = salePrice < originalPrice;
  const discount = hasSale
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const availableVariants =
    product.variants?.filter((variant) => variant.stock > 0) || [];

  const defaultSize = availableVariants[0]?.size || "Free Size";
  const [selectedSize, setSelectedSize] = useState(defaultSize);

  const isInCart = cart.some(
    (item) => item.id === product.id && item.size === selectedSize
  );

  const isFav = isWishlisted(product.id);

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: salePrice,
      image: product.images?.[0]?.url || "",
    });

    showToast(
      isFav
        ? `Removed ${product.name} from your wishlist`
        : `Added ${product.name} to your wishlist`,
      {
        type: "wishlist",
        action: { label: "View Wishlist", href: "/wishlist" },
      }
    );
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isInCart) {
      removeFromCart(product.id, selectedSize, "");
      showToast(`Removed ${product.name} from your bag`, { type: "info" });
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: salePrice,
        image: product.images?.[0]?.url || "",
        size: selectedSize,
        color: "",
        quantity: 1,
      });

      showToast(`Added ${product.name} (${selectedSize}) to your bag`, {
        type: "cart",
        action: { label: "Checkout", href: "/cart" },
      });
    }
  }

  return (
    <article className="product-card">
      {/* CARD IMAGE & BADGES */}
      <div className="product-card-image">
        {discount > 0 ? (
          <span className="product-badge sale">✦ {discount}% OFF</span>
        ) : badge ? (
          <span className="product-badge">
            {badge === "NEW" ? "✦ NEW ARRIVAL" : badge === "BESTSELLER" ? "★ BESTSELLER" : badge}
          </span>
        ) : null}

        <button
          type="button"
          className={`wishlist-heart-btn ${isFav ? "active" : ""}`}
          onClick={handleWishlistClick}
          aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon size={18} filled={isFav} />
        </button>

        <Link href={`/shop/${product.slug}`} className="block w-full h-full">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText || product.name}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-serif text-stone-400 text-lg bg-stone-100">
              {product.category?.name || "PQN COUTURE"}
            </div>
          )}
        </Link>
      </div>

      {/* CARD BODY */}
      <div className="product-card-body">
        {product.category?.name && (
          <span className="product-card-category">{product.category.name}</span>
        )}

        <Link href={`/shop/${product.slug}`}>
          <h3 className="product-card-title">{product.name}</h3>
        </Link>

        {/* PRICING */}
        <div className="product-card-prices">
          <span className="product-current-price">
            ₹{salePrice.toLocaleString("en-IN")}
          </span>
          {hasSale && (
            <span className="product-original-price">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          )}
          {discount > 0 && (
            <span className="product-discount-tag">{discount}% OFF</span>
          )}
        </div>

        {/* SIZES */}
        {availableVariants.length > 0 && (
          <div className="product-card-sizes" aria-label="Available sizes">
            {availableVariants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`size-pill ${selectedSize === v.size ? "selected" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedSize(v.size);
                }}
              >
                {v.size}
              </button>
            ))}
          </div>
        )}

        {/* ADD TO BAG BUTTON */}
        <button
          type="button"
          className={`product-card-cta ${isInCart ? "added" : ""}`}
          onClick={handleAddToCart}
        >
          {isInCart ? (
            <>
              <CheckIcon size={16} />
              IN YOUR BAG
            </>
          ) : (
            <>
              <BagIcon size={16} />
              ADD TO BAG
            </>
          )}
        </button>
      </div>
    </article>
  );
}

/* ==========================================================================
   HOMEPAGE COMPONENT
   ========================================================================== */

export default function Home() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Dynamic Hero Slides & Backgrounds
  const [heroSlides, setHeroSlides] = useState([
    {
      id: "slide-1",
      title: "Elegance Crafted for Your Special Moments",
      subtitle: "Immerse yourself in artisan-embroidered designer lehengas, majestic royal suit sets, and breathtaking party wear curated to make you the queen of every occasion.",
      imageUrl: "",
      ctaText: "EXPLORE COLLECTION",
      ctaLink: "/shop",
      ctaSecondaryText: "NEW ARRIVALS",
      ctaSecondaryLink: "/shop?filter=new",
      badge: "2026 Haute Couture Collection",
      active: true,
      order: 1,
    },
  ]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  useEffect(() => {
    async function loadBanners() {
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const json = await res.json();
          if (json.banners?.heroSlides) {
            const active = json.banners.heroSlides.filter((s: any) => s.active);
            if (active.length > 0) {
              setHeroSlides(active);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load hero banner slides:", err);
      }
    }
    loadBanners();
  }, []);

  // Auto-rotate hero slides if multiple are active
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to load products");
        const data = await response.json();
        const activeProducts = Array.isArray(data)
          ? data.filter(
              (product: Product) =>
                product.status === "ACTIVE" || !product.status
            )
          : [];
        setProducts(activeProducts);
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const sortedNewest = [...products].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const bestSellers = products.slice(0, 4);
  const newArrivals = sortedNewest.slice(0, 4);
  const offerProducts = products
    .filter((p) => {
      if (p.salePrice === null || p.salePrice === undefined) return false;
      return Number(p.salePrice) < Number(p.price);
    })
    .slice(0, 4);

  function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = newsletterEmail.trim();

    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address.", { type: "error" });
      return;
    }

    showToast("Welcome to the PQN VIP Fashion Circle! Enjoy 10% off your first order.", {
      type: "success",
    });
    setNewsletterEmail("");
  }

  function handleCopyPromo() {
    navigator.clipboard.writeText("PQN10");
    showToast("Coupon code PQN10 copied to clipboard!", { type: "success" });
  }

  const currentSlide = heroSlides[activeSlideIdx] || heroSlides[0];
  const hasBgImage = Boolean(currentSlide.imageUrl && currentSlide.imageUrl.trim().length > 0);

  return (
    <main>
      {/* 1. HERO SECTION */}
      <section
        className="hero"
        style={{
          position: "relative",
          background: hasBgImage
            ? "#072818"
            : "linear-gradient(145deg, #f0f7f3 0%, #fefefd 50%, #e8f3ec 100%)",
          minHeight: "540px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "85px 24px 95px",
          transition: "background 0.5s ease",
        }}
      >
        {/* CUSTOM HERO BACKGROUND IMAGE */}
        {hasBgImage && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 1 }}>
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                transform: "scale(1.02)",
                transition: "all 0.6s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(7,40,24,0.4) 0%, rgba(7,40,24,0.72) 55%, rgba(7,40,24,0.92) 100%)",
              }}
            />
          </div>
        )}

        <div className="hero-content" style={{ position: "relative", zIndex: 3 }}>
          {currentSlide.badge && (
            <div
              className="hero-pill"
              style={{
                background: hasBgImage ? "rgba(7,40,24,0.85)" : "rgba(255, 255, 255, 0.95)",
                color: hasBgImage ? "#f5d77f" : "var(--brand-rose)",
                borderColor: hasBgImage ? "rgba(197, 155, 39, 0.6)" : "rgba(197, 155, 39, 0.4)",
                backdropFilter: hasBgImage ? "blur(6px)" : "none",
              }}
            >
              <SparklesIcon size={14} />
              <span>{currentSlide.badge}</span>
            </div>
          )}

          <h1
            style={{
              color: hasBgImage ? "#ffffff" : "var(--color-noir)",
              textShadow: hasBgImage ? "0 2px 20px rgba(0,0,0,0.6)" : "none",
            }}
          >
            {currentSlide.title}
          </h1>

          <p
            className="hero-text"
            style={{
              color: hasBgImage ? "rgba(255,255,255,0.92)" : "var(--color-text-muted)",
              textShadow: hasBgImage ? "0 1px 10px rgba(0,0,0,0.5)" : "none",
            }}
          >
            {currentSlide.subtitle}
          </p>

          <div className="hero-actions">
            <Link
              href={currentSlide.ctaLink || "/shop"}
              className={`btn-primary ${hasBgImage ? "hero-btn-image-primary" : ""}`}
            >
              {currentSlide.ctaText || "EXPLORE COLLECTION"}
              <ArrowRightIcon size={16} />
            </Link>

            <Link
              href={currentSlide.ctaSecondaryLink || "/shop?filter=new"}
              className={`btn-secondary ${hasBgImage ? "hero-btn-image-secondary" : ""}`}
            >
              {currentSlide.ctaSecondaryText || "NEW ARRIVALS"}
            </Link>
          </div>
        </div>

        {/* SLIDE NAVIGATION DOTS IF MULTIPLE SLIDES */}
        {heroSlides.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "22px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              gap: "8px",
            }}
          >
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlideIdx(idx)}
                style={{
                  width: activeSlideIdx === idx ? "26px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: activeSlideIdx === idx ? "#c59b27" : (hasBgImage ? "rgba(255,255,255,0.4)" : "#cbd5e1"),
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 2. CATEGORIES SHOWCASE */}
      <CategoryShowcase />

      {/* 3. BEST SELLERS */}
      <section className="section-wrapper" style={{ background: "var(--bg-subtle)" }}>
        <div className="section-heading">
          <span className="section-eyebrow">MOST LOVED</span>
          <h2>Best Sellers</h2>
          <p>Iconic silhouettes cherished by our discerning patrons</p>
        </div>

        <div className="product-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: "440px",
                  background: "var(--bg-surface)",
                  borderRadius: "8px",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))
          ) : bestSellers.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              No products found.
            </div>
          ) : (
            bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} badge="BESTSELLER" />
            ))
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/shop" className="btn-secondary">
            VIEW ALL PRODUCTS <ArrowRightIcon size={16} />
          </Link>
        </div>
      </section>

      {/* 4. NEW ARRIVALS */}
      <section className="section-wrapper">
        <div className="section-heading">
          <span className="section-eyebrow">JUST ARRIVED</span>
          <h2>New In Season</h2>
          <p>Be the first to wear the freshest fashion statements</p>
        </div>

        <div className="product-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: "440px",
                  background: "var(--bg-surface)",
                  borderRadius: "8px",
                  animation: "pulse 1.5s infinite",
                }}
              />
            ))
          ) : newArrivals.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              New arrivals coming soon.
            </div>
          ) : (
            newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} badge="NEW" />
            ))
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/shop?filter=new" className="btn-secondary">
            VIEW ALL NEW ARRIVALS <ArrowRightIcon size={16} />
          </Link>
        </div>
      </section>

      {/* 5. SPECIAL OFFERS */}
      {offerProducts.length > 0 && (
        <section className="section-wrapper" style={{ background: "var(--bg-rose-tint)" }}>
          <div className="section-heading">
            <span className="section-eyebrow">LIMITED TIME</span>
            <h2>Exclusive Offers</h2>
            <p>Special curation with celebratory seasonal savings</p>
          </div>

          <div className="product-grid">
            {offerProducts.map((product) => (
              <ProductCard key={product.id} product={product} badge="OFFER" />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link href="/shop?filter=offers" className="btn-secondary">
              SHOP ALL OFFERS <ArrowRightIcon size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* 6. PROMOTIONAL BANNER */}
      <section className="promo-banner-section">
        <div className="promo-banner-card">
          <span className="section-eyebrow">CELEBRATION GIFT</span>
          <h2>
            Your Grand Entrance Starts Here.<br />
            Enjoy 10% Off Your First Order.
          </h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: "520px", margin: "0 auto" }}>
            Apply our exclusive inaugural discount code at checkout for immediate savings on all designer collections.
          </p>

          <div className="promo-coupon-badge">
            <TagIcon size={16} className="text-pink-700" />
            <span>USE CODE: <strong>PQN10</strong></span>
            <button
              type="button"
              onClick={handleCopyPromo}
              style={{
                fontSize: "11px",
                fontWeight: "700",
                textDecoration: "underline",
                color: "var(--brand-rose)",
                marginLeft: "8px",
              }}
            >
              COPY
            </button>
          </div>

          <div>
            <Link href="/shop" className="btn-primary">
              CLAIM OFFER NOW <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. WHY SHOP WITH US (BENEFITS) */}
      <section className="benefits-section">
        <div className="section-heading" style={{ marginBottom: "48px" }}>
          <span className="section-eyebrow" style={{ color: "#c59b27", fontWeight: "800", letterSpacing: "2.5px" }}>
            THE PQN HAUTE COUTURE PROMISE
          </span>
          <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", color: "#072818", marginTop: "4px" }}>
            Crafted for Unmatched Elegance
          </h2>
          <p style={{ color: "#78716c", fontSize: "14.5px", maxWidth: "560px", margin: "10px auto 0" }}>
            Experience world-class couture standards, bespoke fit craftsmanship, and seamless royal hospitality.
          </p>
        </div>

        <div className="benefits-grid">
          {/* Card 1 */}
          <div className="benefit-item">
            <span className="benefit-pill-number">01</span>
            <div className="benefit-icon-box">
              <TruckIcon size={28} />
            </div>
            <span className="benefit-tag">COMPLIMENTARY AIR EXPRESS</span>
            <h3>Express Delivery</h3>
            <p>Priority insured air express door-to-door delivery with real-time GPS tracking across all PIN codes in India.</p>
          </div>

          {/* Card 2 */}
          <div className="benefit-item">
            <span className="benefit-pill-number">02</span>
            <div className="benefit-icon-box">
              <ShieldCheckIcon size={28} />
            </div>
            <span className="benefit-tag">100% ARTISANAL PRECISION</span>
            <h3>Authentic Quality</h3>
            <p>Hand-inspected pure silks, handcrafted zardozi embroidery, and rigorous 4-step quality assurance before dispatch.</p>
          </div>

          {/* Card 3 */}
          <div className="benefit-item">
            <span className="benefit-pill-number">03</span>
            <div className="benefit-icon-box">
              <RefreshCwIcon size={28} />
            </div>
            <span className="benefit-tag">EASY 7-DAY DOORSTEP EXCHANGE</span>
            <h3>Hassle-Free Returns</h3>
            <p>Seamless 7-day size alterations and printerless return pickups at your doorstep with instant refund processing.</p>
          </div>

          {/* Card 4 */}
          <div className="benefit-item">
            <span className="benefit-pill-number">04</span>
            <div className="benefit-icon-box">
              <SparklesIcon size={28} />
            </div>
            <span className="benefit-tag">AI VIRTUAL FIT & STYLING</span>
            <h3>Bespoke Fitting</h3>
            <p>AI-powered virtual try-on, multi-family size profiling, and bespoke seam allowances for a tailored silhouette.</p>
          </div>
        </div>
      </section>
    </main>
  );
}