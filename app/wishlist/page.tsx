"use client";

import React from "react";
import Link from "next/link";
import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/CartContext";
import { useToast } from "@/app/context/ToastContext";
import {
  HeartIcon,
  BagIcon,
  TrashIcon,
  ArrowRightIcon,
} from "@/app/components/Icons";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  function handleMoveToBag(item: (typeof wishlist)[number]) {
    addToCart({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
      size: "Free Size",
      color: "",
      quantity: 1,
    });

    removeFromWishlist(item.id);
    showToast(`Moved ${item.name} to your shopping bag!`, {
      type: "cart",
      action: { label: "View Bag", href: "/cart" },
    });
  }

  function handleRemove(id: string, name: string) {
    removeFromWishlist(id);
    showToast(`Removed ${name} from your wishlist`, { type: "info" });
  }

  if (wishlist.length === 0) {
    return (
      <main className="wishlist-container">
        <div className="empty-state-card">
          <div className="empty-icon-circle">
            <HeartIcon size={32} filled={false} />
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px" }}>
            Your Wishlist Is Empty
          </h1>
          <p style={{ margin: "14px 0 28px", color: "var(--color-text-muted)" }}>
            Save the handcrafted designs you cherish to review them whenever inspiration strikes.
          </p>
          <Link href="/shop" className="btn-primary">
            EXPLORE COLLECTIONS <ArrowRightIcon size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-container">
      {/* HEADER */}
      <div className="section-heading" style={{ marginBottom: "36px" }}>
        <span className="section-eyebrow">YOUR SAVED STYLES</span>
        <h1>My Wishlist</h1>
        <p>Curated pieces saved for your grand occasions</p>
      </div>

      {/* TOP CONTROLS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          paddingBottom: "14px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          {wishlist.length} {wishlist.length === 1 ? "Saved Item" : "Saved Items"}
        </span>

        <button
          type="button"
          onClick={() => {
            clearWishlist();
            showToast("Cleared your wishlist", { type: "info" });
          }}
          style={{
            fontSize: "12px",
            color: "var(--brand-rose)",
            fontWeight: "600",
            textDecoration: "underline",
          }}
        >
          CLEAR ALL
        </button>
      </div>

      {/* GRID */}
      <div className="product-grid">
        {wishlist.map((item) => (
          <article key={item.id} className="product-card">
            <div className="product-card-image">
              <button
                type="button"
                className="wishlist-heart-btn active"
                onClick={() => handleRemove(item.id, item.name)}
                aria-label="Remove from wishlist"
              >
                <HeartIcon size={18} filled={true} />
              </button>

              {/* FIX: Link to /shop/${slug} */}
              <Link href={`/shop/${item.slug}`} className="block w-full h-full">
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-serif text-stone-400 text-lg bg-stone-100">
                    PQN COUTURE
                  </div>
                )}
              </Link>
            </div>

            <div className="product-card-body">
              {/* FIX: Link to /shop/${slug} */}
              <Link href={`/shop/${item.slug}`}>
                <h3 className="product-card-title">{item.name}</h3>
              </Link>

              <div className="product-card-prices">
                <span className="product-current-price">
                  ₹{Number(item.price).toLocaleString("en-IN")}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                <button
                  type="button"
                  className="product-card-cta"
                  onClick={() => handleMoveToBag(item)}
                >
                  <BagIcon size={16} /> MOVE TO BAG
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}