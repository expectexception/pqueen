"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { useToast } from "@/app/context/ToastContext";
import {
  HeartIcon,
  BagIcon,
  CheckIcon,
  SearchIcon,
  CloseIcon,
  FilterIcon,
  ArrowRightIcon,
  SparklesIcon,
  CameraIcon,
} from "@/app/components/Icons";
import VisualSearchModal from "@/app/components/VisualSearchModal";
import { appConfig } from "@/lib/config";

type ProductImage = {
  id?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number;
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
  status?: string;
  createdAt?: string;
  category?: {
    id?: string;
    name: string;
    slug?: string;
  } | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
};

const CATEGORIES = [
  { id: "all", name: "All Styles", slug: "" },
  { id: "lehengas", name: "Lehengas", slug: "lehengas" },
  { id: "suit-sets", name: "Suit Sets", slug: "suit-sets" },
  { id: "sarees", name: "Sarees", slug: "sarees" },
  { id: "gowns", name: "Gowns", slug: "gowns" },
  { id: "cord-sets", name: "Cord Sets", slug: "cord-sets" },
  { id: "dupattas", name: "Dupattas", slug: "dupattas" },
];

function ShopProductCard({ product }: { product: Product }) {
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

  const isFav = isWishlisted(product.id);
  const availableVariants =
    product.variants?.filter((v) => v.stock > 0) || [];
  const defaultSize = availableVariants[0]?.size || "Free Size";
  const [selectedSize, setSelectedSize] = useState(defaultSize);

  const isInCart = cart.some(
    (item) => item.id === product.id && item.size === selectedSize
  );

  return (
    <article className="product-card">
      {/* IMAGE */}
      <div className="product-card-image">
        {discount > 0 && (
          <span className="product-badge sale">✦ {discount}% OFF</span>
        )}

        <button
          type="button"
          className={`wishlist-heart-btn ${isFav ? "active" : ""}`}
          onClick={(e) => {
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
                ? `Removed ${product.name} from wishlist`
                : `Saved ${product.name} to wishlist`,
              {
                type: "wishlist",
                action: { label: "View Wishlist", href: "/wishlist" },
              }
            );
          }}
          aria-label="Toggle Wishlist"
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

      {/* BODY */}
      <div className="product-card-body">
        {product.category?.name && (
          <span className="product-card-category">{product.category.name}</span>
        )}

        <Link href={`/shop/${product.slug}`}>
          <h3 className="product-card-title">{product.name}</h3>
        </Link>

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

        {/* QUICK ADD / REMOVE CTA */}
        <button
          type="button"
          className={`product-card-cta ${isInCart ? "added" : ""}`}
          onClick={(e) => {
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
          }}
        >
          {isInCart ? (
            <>
              <CheckIcon size={16} /> IN YOUR BAG
            </>
          ) : (
            <>
              <BagIcon size={16} /> ADD TO BAG
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cart, addToCart, removeFromCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters from URL or local state
  const categoryParam = searchParams.get("category") || "";
  const filterParam = searchParams.get("filter") || "";
  const searchParam = searchParams.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedFabric, setSelectedFabric] = useState("all");
  const [selectedOccasion, setSelectedOccasion] = useState("all");
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [onlySale, setOnlySale] = useState<boolean>(filterParam === "offers");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Sync state when URL params change
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSearchTerm(searchParam);
    if (filterParam === "offers") setOnlySale(true);
  }, [categoryParam, filterParam, searchParam]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Failed to fetch products");

        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid products response");

        setProducts(data as Product[]);
      } catch (err) {
        console.error("SHOP PRODUCTS ERROR:", err);
        setError("Unable to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadProducts();
  }, []);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((p) => {
        const catSlug = p.category?.slug?.toLowerCase() || "";
        const catName = p.category?.name?.toLowerCase() || "";
        const query = selectedCategory.toLowerCase();
        return catSlug === query || catName.includes(query);
      });
    }

    // Fabric filter
    if (selectedFabric && selectedFabric !== "all") {
      list = list.filter((p) => {
        const name = p.name.toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const fab = selectedFabric.toLowerCase();
        return name.includes(fab) || desc.includes(fab);
      });
    }

    // Occasion filter
    if (selectedOccasion && selectedOccasion !== "all") {
      list = list.filter((p) => {
        const name = p.name.toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const occ = selectedOccasion.toLowerCase();
        return name.includes(occ) || desc.includes(occ);
      });
    }

    // New arrivals filter
    if (filterParam === "new") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    // Only sale offers
    if (onlySale) {
      list = list.filter(
        (p) =>
          p.salePrice !== null &&
          p.salePrice !== undefined &&
          Number(p.salePrice) < Number(p.price)
      );
    }

    // Only in stock
    if (onlyInStock) {
      list = list.filter((p) =>
        p.variants?.some((v) => v.stock > 0)
      );
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === "price-low") {
      list.sort((a, b) => {
        const priceA = a.salePrice ? Number(a.salePrice) : Number(a.price);
        const priceB = b.salePrice ? Number(b.salePrice) : Number(b.price);
        return priceA - priceB;
      });
    } else if (sortBy === "price-high") {
      list.sort((a, b) => {
        const priceA = a.salePrice ? Number(a.salePrice) : Number(a.price);
        const priceB = b.salePrice ? Number(b.salePrice) : Number(b.price);
        return priceB - priceA;
      });
    } else if (sortBy === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    } else if (sortBy === "discount") {
      list.sort((a, b) => {
        const discA = a.salePrice
          ? (Number(a.price) - Number(a.salePrice)) / Number(a.price)
          : 0;
        const discB = b.salePrice
          ? (Number(b.price) - Number(b.salePrice)) / Number(b.price)
          : 0;
        return discB - discA;
      });
    }

    return list;
  }, [products, selectedCategory, filterParam, onlySale, onlyInStock, searchTerm, sortBy]);

  function handleCategoryClick(slug: string) {
    setSelectedCategory(slug);
    if (slug) {
      router.push(`/shop?category=${slug}`);
    } else {
      router.push("/shop");
    }
  }

  function handleClearFilters() {
    setSelectedCategory("");
    setSearchTerm("");
    setOnlySale(false);
    setOnlyInStock(false);
    setSortBy("featured");
    router.push("/shop");
  }

  return (
    <main className="shop-container">
      {/* HEADER BANNER */}
      <div className="shop-header-banner">
        <span className="section-eyebrow">EXCLUSIVE CATALOGUE</span>
        <h1>
          {selectedCategory
            ? `${selectedCategory.toUpperCase()} COLLECTION`
            : filterParam === "new"
            ? "NEW ARRIVALS"
            : filterParam === "offers"
            ? "SPECIAL OFFERS & DEALS"
            : "ALL DESIGNER STYLES"}
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", maxWidth: "600px", margin: "0 auto" }}>
          Discover hand-crafted festive lehengas, majestic royal anarkalis, and statement evening gowns.
        </p>
      </div>

      {/* CONTROLS BAR */}
      <div className="shop-controls-bar">
        {/* Category Pills */}
        <div className="shop-categories-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill-btn ${
                (cat.slug === "" && !selectedCategory) || selectedCategory === cat.slug
                  ? "active"
                  : ""
              }`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Right Sort & Search Controls */}
        <div className="shop-right-filters" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Visual Search Button */}
          <button
            type="button"
            onClick={() => setIsVisualSearchOpen(true)}
            style={{
              height: "38px",
              padding: "0 14px",
              borderRadius: "4px",
              background: "#0d4428",
              color: "#f5d77f",
              border: "1px solid #072818",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <CameraIcon size={14} /> VISUAL SEARCH
          </button>

          {/* Quick Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid var(--border-medium)",
              borderRadius: "4px",
              padding: "0 10px",
              background: "var(--bg-surface)",
              height: "38px",
            }}
          >
            <SearchIcon size={16} className="text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in shop..."
              style={{
                border: "none",
                outline: "none",
                padding: "6px 8px",
                fontSize: "13px",
                width: "130px",
                background: "transparent",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products by"
          >
            <option value="featured">Sort: Featured</option>
            <option value="newest">Sort: Newest In</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Highest Discount</option>
          </select>
        </div>
      </div>

      {/* ADVANCED ATTRIBUTE FILTERS (FABRIC & OCCASION) */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", margin: "16px 0 24px", padding: "14px 18px", background: "#f6f9f7", borderRadius: "8px", border: "1px solid #d4e2d8", alignItems: "center" }}>
        {/* Fabric filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", textTransform: "uppercase" }}>Fabric:</span>
          {["all", "Silk", "Velvet", "Organza", "Georgette", "Brocade"].map((fab) => (
            <button
              key={fab}
              type="button"
              onClick={() => setSelectedFabric(fab)}
              style={{
                padding: "4px 10px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                border: selectedFabric.toLowerCase() === fab.toLowerCase() ? "1px solid #0d4428" : "1px solid #d1d5db",
                background: selectedFabric.toLowerCase() === fab.toLowerCase() ? "#0d4428" : "#fff",
                color: selectedFabric.toLowerCase() === fab.toLowerCase() ? "#f5d77f" : "#374151",
              }}
            >
              {fab === "all" ? "All Fabrics" : fab}
            </button>
          ))}
        </div>

        {/* Occasion filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", textTransform: "uppercase" }}>Occasion:</span>
          {["all", "Bridal", "Wedding", "Sangeet", "Reception", "Festive"].map((occ) => (
            <button
              key={occ}
              type="button"
              onClick={() => setSelectedOccasion(occ)}
              style={{
                padding: "4px 10px",
                borderRadius: "14px",
                fontSize: "11px",
                fontWeight: "700",
                cursor: "pointer",
                border: selectedOccasion.toLowerCase() === occ.toLowerCase() ? "1px solid #0d4428" : "1px solid #d1d5db",
                background: selectedOccasion.toLowerCase() === occ.toLowerCase() ? "#0d4428" : "#fff",
                color: selectedOccasion.toLowerCase() === occ.toLowerCase() ? "#f5d77f" : "#374151",
              }}
            >
              {occ === "all" ? "All Occasions" : occ}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER ACTIVE TAGS & COUNT */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          fontSize: "13px",
          color: "var(--color-text-muted)",
        }}
      >
        <div>
          Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "design" : "designs"}
          {(selectedCategory || searchTerm || onlySale || onlyInStock) && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                marginLeft: "14px",
                color: "var(--brand-rose)",
                fontWeight: "600",
                textDecoration: "underline",
              }}
            >
              Clear all filters
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={onlySale}
              onChange={(e) => setOnlySale(e.target.checked)}
              style={{ accentColor: "var(--brand-rose)" }}
            />
            <span>On Sale</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              style={{ accentColor: "var(--brand-rose)" }}
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>

      {/* AI SMART OCCASIONS & STYLING FILTER STRIP */}
      {appConfig.ai.enableAiFilters && (
        <div
          style={{
            background: "linear-gradient(135deg, #fdf8f9 0%, #faf3f5 100%)",
            border: "1px solid rgba(155, 77, 101, 0.15)",
            borderRadius: "6px",
            padding: "10px 16px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            boxShadow: "0 2px 8px rgba(155, 77, 101, 0.04)",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--brand-rose)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              marginRight: "4px",
            }}
          >
            <SparklesIcon size={14} /> AI Smart Styling:
          </span>

          {[
            { label: "All Curations", query: "" },
            { label: "Bridal Trousseau", query: "bridal" },
            { label: "Sangeet & Mehendi", query: "sangeet" },
            { label: "Cocktail Glamour", query: "cocktail" },
            { label: "Royal Festive", query: "festive" },
            { label: "Grand Reception", query: "reception" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSearchTerm(item.query)}
              style={{
                fontSize: "11px",
                fontWeight: searchTerm.toLowerCase() === item.query ? "700" : "500",
                background: searchTerm.toLowerCase() === item.query ? "var(--brand-rose)" : "#fff",
                color: searchTerm.toLowerCase() === item.query ? "#fff" : "var(--color-noir)",
                border: searchTerm.toLowerCase() === item.query ? "1px solid var(--brand-rose)" : "1px solid var(--border-medium)",
                borderRadius: "20px",
                padding: "4px 12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* PRODUCT GRID */}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "440px",
                background: "var(--bg-surface)",
                borderRadius: "8px",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="empty-state-card">
          <h2>Notice</h2>
          <p style={{ margin: "12px 0 20px" }}>{error}</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            TRY AGAIN
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-circle">
            <FilterIcon size={28} />
          </div>
          <h2>No matching styles found</h2>
          <p style={{ margin: "12px 0 24px", color: "var(--color-text-muted)" }}>
            We couldn&apos;t find any items matching your selected criteria.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleClearFilters}
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* VISUAL SEARCH MODAL */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
      />
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="shop-container" style={{ textAlign: "center", padding: "100px 20px" }}>
          <h2>Loading collection...</h2>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}