"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useToast } from "@/app/context/ToastContext";
import {
  BagIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  TagIcon,
  CheckIcon,
  ArrowRightIcon,
  TruckIcon,
} from "@/app/components/Icons";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { showToast } = useToast();

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; description?: string } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const subtotal: number = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Discount calculation
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const shipping: number = 0; // Free express shipping
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  // Load saved promo from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pqn-applied-promo");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.code) {
          setAppliedPromo(parsed);
        }
      }
    } catch {}
  }, []);

  // Recalculate discount if subtotal changes
  useEffect(() => {
    if (!appliedPromo || subtotal === 0) return;
    // Revalidate against validate endpoint to ensure correct percentage discount
    fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: appliedPromo.code, cartSubtotal: subtotal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.coupon) {
          const updated = {
            code: data.coupon.code,
            discountAmount: data.coupon.discountAmount,
            description: data.coupon.description,
          };
          setAppliedPromo(updated);
          localStorage.setItem("pqn-applied-promo", JSON.stringify(updated));
        }
      })
      .catch(() => {});
  }, [subtotal]);

  async function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    try {
      setValidatingPromo(true);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartSubtotal: subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Invalid voucher code.", { type: "error" });
        return;
      }

      const newPromo = {
        code: data.coupon.code,
        discountAmount: data.coupon.discountAmount,
        description: data.coupon.description,
      };
      setAppliedPromo(newPromo);
      localStorage.setItem("pqn-applied-promo", JSON.stringify(newPromo));
      showToast(`Voucher ${data.coupon.code} applied! Saved ₹${data.coupon.discountAmount.toLocaleString("en-IN")}`, { type: "success" });
      setPromoInput("");
    } catch {
      showToast("Could not validate voucher code.", { type: "error" });
    } finally {
      setValidatingPromo(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    localStorage.removeItem("pqn-applied-promo");
    showToast("Voucher removed", { type: "info" });
  }

  function handleRemoveItem(id: string, size: string, color: string, name: string) {
    removeFromCart(id, size, color);
    showToast(`Removed ${name} from your bag`, { type: "info" });
  }

  if (cart.length === 0) {
    return (
      <main className="cart-layout">
        <div className="empty-state-card">
          <div className="empty-icon-circle">
            <BagIcon size={32} />
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px" }}>
            Your Shopping Bag Is Empty
          </h1>
          <p style={{ margin: "14px 0 28px", color: "var(--color-text-muted)" }}>
            Explore our handcrafted festive lehengas, suit sets, and evening gowns to begin your style journey.
          </p>
          <Link href="/shop" className="btn-primary">
            DISCOVER COLLECTION <ArrowRightIcon size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-layout">
      {/* PAGE HEADER */}
      <div className="cart-page-header">
        <span className="section-eyebrow">ORDER BAG</span>
        <h1>Your Shopping Bag</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Review your items before proceeding to secure checkout.
        </p>
      </div>

      <div className="cart-grid">
        {/* LEFT: CART ITEMS & SHIPPING BANNER */}
        <div className="cart-left-col">
          <div className="cart-items-wrapper">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.color}-${item.size}`}
                className="cart-item-row"
              >
                {/* Image */}
                <Link href={`/shop/${item.slug}`} className="cart-item-thumb">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#888" }}>
                      PQN
                    </div>
                  )}
                </Link>

                {/* Information */}
                <div className="cart-item-details">
                  <Link href={`/shop/${item.slug}`}>
                    <h3>{item.name}</h3>
                  </Link>

                  <div className="cart-item-meta">
                    {item.color && <span>Color: <strong>{item.color}</strong> &nbsp;|&nbsp; </span>}
                    <span>Size: <strong>{item.size}</strong></span>
                  </div>

                  <div style={{ fontWeight: "700", color: "var(--color-noir)", fontSize: "15px" }}>
                    ₹{item.price.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Quantity Stepper & Remove */}
                <div className="cart-item-actions">
                  <div className="cart-quantity-stepper">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.size,
                          item.color,
                          Math.max(1, item.quantity - 1)
                        )
                      }
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon size={12} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.size,
                          item.color,
                          item.quantity + 1
                        )
                      }
                      aria-label="Increase quantity"
                    >
                      <PlusIcon size={12} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveItem(
                        item.id,
                        item.size,
                        item.color,
                        item.name
                      )
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#991b1b",
                    }}
                    aria-label="Remove item"
                  >
                    <TrashIcon size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FREE SHIPPING PROGRESS BANNER */}
          <div className="cart-free-shipping-card">
            <div className="cart-free-shipping-icon">
              <TruckIcon size={20} />
            </div>
            <div className="cart-free-shipping-text">
              <strong>Complimentary Express Delivery Unlocked!</strong>
              <p>Enjoy free tracked delivery across India on this order.</p>
            </div>
          </div>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <aside className="cart-summary-box">
          <h2>Order Summary</h2>

          {/* Promo code box */}
          <form onSubmit={handleApplyPromo} style={{ marginBottom: "20px" }}>
            <label
              htmlFor="coupon-code"
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Promotional Voucher
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                id="coupon-code"
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="e.g. PQN10"
                style={{
                  flex: 1,
                  height: "40px",
                  padding: "0 12px",
                  border: "1px solid var(--border-medium)",
                  borderRadius: "4px",
                  fontSize: "13px",
                  textTransform: "uppercase",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0 14px",
                  background: "var(--color-noir)",
                  color: "#fff",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                }}
              >
                APPLY
              </button>
            </div>

            {appliedPromo && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#15803d",
                  fontWeight: "600",
                }}
              >
                <span>✓ Voucher {appliedPromo.code} applied (-₹{appliedPromo.discountAmount.toLocaleString("en-IN")})</span>
                <button
                  type="button"
                  onClick={() => setAppliedPromo(null)}
                  style={{ textDecoration: "underline", color: "#888", background: "none", border: "none", cursor: "pointer", fontSize: "11px" }}
                >
                  Remove
                </button>
              </div>
            )}
          </form>

          {/* Price Breakdown */}
          <div className="summary-line">
            <span>Bag Subtotal ({cart.length} items)</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>

          {discountAmount > 0 && (
            <div className="summary-line" style={{ color: "var(--brand-rose)" }}>
              <span>Special Discount (PQN10)</span>
              <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}

          <div className="summary-line">
            <span>Estimated Shipping</span>
            <span style={{ color: "#15803d", fontWeight: "600" }}>FREE</span>
          </div>

          <div className="summary-line total">
            <span>Total Payable</span>
            <span>₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>

          {/* CHECKOUT BUTTON */}
          <Link
            href="/checkout"
            className="btn-primary"
            style={{ width: "100%", marginTop: "24px", padding: "16px" }}
          >
            PROCEED TO CHECKOUT <ArrowRightIcon size={16} />
          </Link>

          <Link
            href="/shop"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "16px",
              fontSize: "13px",
              color: "var(--color-text-muted)",
            }}
          >
            ← Continue Browsing
          </Link>
        </aside>
      </div>
    </main>
  );
}