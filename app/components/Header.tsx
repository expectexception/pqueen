"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import { useAuth } from "@/app/context/AuthContext";
import {
  BagIcon,
  HeartIcon,
  SearchIcon,
  CloseIcon,
  MenuIcon,
  SparklesIcon,
  ChevronRightIcon,
  UserIcon,
} from "@/app/components/Icons";
import { appConfig } from "@/lib/config";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  salePrice?: number | string | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  images?: {
    url: string;
    altText?: string | null;
  }[];
};

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();

  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Load products when search opens
  useEffect(() => {
    if (!searchOpen) return;

    async function loadProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to load products");
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Search products error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [searchOpen]);

  const searchText = search.trim().toLowerCase();

  const searchResults =
    searchText.length === 0
      ? []
      : products
          .filter((product) => {
            const productName = product.name?.toLowerCase() || "";
            const categoryName = product.category?.name?.toLowerCase() || "";
            const categorySlug = product.category?.slug?.toLowerCase() || "";

            return (
              productName.includes(searchText) ||
              categoryName.includes(searchText) ||
              categorySlug.includes(searchText)
            );
          })
          .slice(0, 6);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR */}
      {appConfig.features.enableAnnouncementBar && (
        <div className="announcement-bar">
          <span>✦ COMPLIMENTARY EXPRESS SHIPPING ACROSS INDIA &bull; USE CODE <span className="accent">PQN10</span> FOR 10% OFF ✦</span>
        </div>
      )}

      {/* STICKY MAIN HEADER */}
      <div className="header-wrapper">
        <header className="header">
          {/* LEFT: Mobile Menu Button & Brand */}
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <MenuIcon size={22} />
            </button>

            <Link href="/" className="logo" aria-label="PQN PARTY QUEEN Home" style={{ display: "inline-flex", alignItems: "center" }}>
              <img
                src="/logo-gold.png?v=3"
                alt="PQN PARTY QUEEN"
                style={{
                  height: "52px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Link>
          </div>

          {/* CENTER: DESKTOP NAVIGATION */}
          <nav className="navigation" aria-label="Primary Navigation">
            <Link
              href="/"
              className={`nav-link ${pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/shop"
              className={`nav-link ${pathname === "/shop" && !pathname.includes("filter") && !pathname.includes("category") ? "active" : ""}`}
            >
              Shop All
            </Link>
            <Link
              href="/shop?filter=new"
              className="nav-link"
            >
              New Arrivals
              <span className="nav-badge">NEW</span>
            </Link>
            <Link
              href="/shop?category=lehengas"
              className="nav-link"
            >
              Lehengas
            </Link>
            <Link
              href="/shop?category=suit-sets"
              className="nav-link"
            >
              Suit Sets
            </Link>
            <Link
              href="/shop?category=sarees"
              className="nav-link"
            >
              Sarees
            </Link>
            <Link
              href="/shop?category=gowns"
              className="nav-link"
            >
              Gowns
            </Link>
            <Link
              href="/shop?filter=offers"
              className="nav-link"
            >
              Offers
            </Link>
          </nav>

          {/* RIGHT: ACTION BUTTONS */}
          <div className="actions">
            {/* Search Trigger */}
            <button
              type="button"
              className="action-btn"
              onClick={() => {
                setSearchOpen(true);
                setSearch("");
              }}
              aria-label="Search collection"
            >
              <SearchIcon size={19} />
            </button>

            {/* Account / Login Link */}
            <Link
              href={user ? "/account" : "/account/login"}
              className="action-btn"
              aria-label={user ? `Signed in as ${user.name}` : "Sign in to account"}
              title={user ? `Account: ${user.name}` : "Member Sign In"}
            >
              {user ? (
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #c59b27, #8f6e16)",
                    color: "#072818",
                    fontSize: "11px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid #f5d77f",
                    boxShadow: "0 2px 6px rgba(197, 155, 39, 0.35)",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <UserIcon size={19} />
              )}
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="action-btn"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <HeartIcon size={19} filled={wishlistCount > 0} />
              {wishlistCount > 0 && (
                <span className="action-badge">{wishlistCount}</span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              href="/cart"
              className="action-btn"
              aria-label={`Shopping bag with ${cartCount} items`}
            >
              <BagIcon size={19} />
              {cartCount > 0 && (
                <span className="action-badge">{cartCount}</span>
              )}
            </Link>
          </div>
        </header>
      </div>

      {/* SEARCH MODAL OVERLAY */}
      {searchOpen && (
        <div
          className="search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="search-modal">
            <div className="search-input-wrapper">
              <SearchIcon size={20} className="text-stone-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search designer lehengas, suits, sarees, dresses..."
              />
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchOpen(false);
                }}
                aria-label="Close search modal"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* RESULTS LIST */}
            {searchText && (
              <div className="search-results-list">
                {loading ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                    Searching collection...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                    No results found for &ldquo;{search}&rdquo;. Try searching for &ldquo;lehenga&rdquo; or &ldquo;suit&rdquo;.
                  </div>
                ) : (
                  searchResults.map((product) => {
                    const price =
                      product.salePrice !== null && product.salePrice !== undefined
                        ? Number(product.salePrice)
                        : Number(product.price);

                    return (
                      <Link
                        key={product.id}
                        href={`/shop/${product.slug}`}
                        className="search-result-item"
                        onClick={() => setSearchOpen(false)}
                      >
                        <div className="search-result-thumb">
                          {product.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].altText || product.name}
                            />
                          ) : (
                            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#999" }}>
                              PQN
                            </div>
                          )}
                        </div>

                        <div className="search-result-info">
                          {product.category?.name && (
                            <span className="category">{product.category.name}</span>
                          )}
                          <h4>{product.name}</h4>
                        </div>

                        <div className="search-result-price">
                          ₹{price.toLocaleString("en-IN")}
                        </div>
                      </Link>
                    );
                  })
                )}

                {searchResults.length > 0 && (
                  <Link
                    href={`/shop?search=${encodeURIComponent(search)}`}
                    className="search-view-all-link"
                    onClick={() => setSearchOpen(false)}
                  >
                    View all {searchResults.length} results →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <>
          <div
            className="drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="drawer-panel">
            <div className="drawer-header">
              <div className="logo">
                <img
                  src="/logo-gold.png?v=3"
                  alt="PQN PARTY QUEEN"
                  style={{ height: "48px", width: "auto", objectFit: "contain" }}
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="drawer-nav">
              <Link href="/" className="drawer-link">
                Home
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/shop" className="drawer-link">
                All Collections
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/shop?filter=new" className="drawer-link">
                <span>New Arrivals <span className="nav-badge">NEW</span></span>
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/shop?category=lehengas" className="drawer-link">
                Designer Lehengas
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/shop?category=suit-sets" className="drawer-link">
                Suit Sets
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/shop?category=dresses" className="drawer-link">
                Party Dresses
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/shop?category=sarees" className="drawer-link">
                Sarees
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/shop?filter=offers" className="drawer-link">
                Special Offers
                <ChevronRightIcon size={16} />
              </Link>
              <Link href={user ? "/account" : "/account/login"} className="drawer-link">
                <span>{user ? `My Account (${user.name})` : "Member Sign In / Register"}</span>
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/wishlist" className="drawer-link">
                <span>Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</span>
                <ChevronRightIcon size={16} />
              </Link>
              <Link href="/cart" className="drawer-link">
                <span>Shopping Bag {cartCount > 0 && `(${cartCount})`}</span>
                <ChevronRightIcon size={16} />
              </Link>
            </div>

            <div className="drawer-footer">
              <p style={{ fontSize: "12px", color: "#78716c", marginBottom: "8px" }}>
                Exclusive High-End Fashion
              </p>
              <p style={{ fontSize: "11px", color: "#a8a29e" }}>
                © 2026 PQN PARTY QUEEN
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}