"use client";

import React, { useState } from "react";
import { useCart } from "@/app/context/CartContext";
import { useToast } from "@/app/context/ToastContext";
import { SparklesIcon, CheckIcon, BagIcon, PlusIcon } from "@/app/components/Icons";

type AccessoryItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  selected: boolean;
};

type CompleteTheLookProps = {
  mainProductName: string;
  mainProductPrice: number;
};

export default function CompleteTheLook({ mainProductName, mainProductPrice }: CompleteTheLookProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [accessories, setAccessories] = useState<AccessoryItem[]>([
    {
      id: "acc-1",
      name: "Handcrafted Royal Polki Kundan Choker Set",
      category: "Jewelry",
      price: 8499,
      image: "/logopq.png",
      selected: true,
    },
    {
      id: "acc-2",
      name: "Gold Zardozi Embellished Velvet Potli Bag",
      category: "Accessories",
      price: 3299,
      image: "/logopq.png",
      selected: true,
    },
    {
      id: "acc-3",
      name: "Artisanal Silk Embroidered Mojari Juttis",
      category: "Footwear",
      price: 2899,
      image: "/logopq.png",
      selected: false,
    },
  ]);

  const [addedBundle, setAddedBundle] = useState(false);

  function toggleItem(id: string) {
    setAccessories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }

  const selectedAccessories = accessories.filter((a) => a.selected);
  const bundleAccessoriesTotal = selectedAccessories.reduce((s, a) => s + a.price, 0);
  const totalBundlePrice = mainProductPrice + bundleAccessoriesTotal;
  const bundleSavings = Math.round(bundleAccessoriesTotal * 0.15); // 15% pairing discount
  const finalDiscountedBundle = totalBundlePrice - bundleSavings;

  function handleAddBundleToBag() {
    selectedAccessories.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        slug: item.id,
        price: item.price,
        image: item.image,
        size: "Free Size",
        color: "",
        quantity: 1,
      });
    });

    setAddedBundle(true);
    showToast(`Added ${selectedAccessories.length} pairing accessories to your bag!`, {
      type: "cart",
      action: { label: "View Bag", href: "/cart" },
    });
    setTimeout(() => setAddedBundle(false), 3000);
  }

  return (
    <section
      style={{
        marginTop: "48px",
        padding: "28px",
        background: "#fdfcf9",
        border: "1px solid #d4e2d8",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <SparklesIcon size={16} className="text-[#c59b27]" />
            <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", color: "#0d4428", textTransform: "uppercase" }}>
              STYLIST'S CURATION
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", margin: 0, color: "var(--color-noir)" }}>
            Complete The Look
          </h2>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            Handpicked accessories perfectly balanced for {mainProductName}
          </span>
        </div>

        <span style={{ padding: "4px 10px", borderRadius: "20px", background: "#f5d77f", color: "#072818", fontSize: "11px", fontWeight: "800" }}>
          BUNDLE & SAVE 15%
        </span>
      </div>

      {/* ACCESSORIES CHECKLIST CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        {accessories.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            style={{
              padding: "14px",
              borderRadius: "6px",
              border: item.selected ? "1.5px solid #0d4428" : "1px solid #e5e7eb",
              background: item.selected ? "#f0f7f3" : "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                border: item.selected ? "none" : "1.5px solid #d1d5db",
                background: item.selected ? "#0d4428" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#f5d77f",
              }}
            >
              {item.selected && <CheckIcon size={14} />}
            </div>

            <div style={{ width: "44px", height: "44px", borderRadius: "4px", background: "#072818", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>

            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "12px", color: "var(--color-noir)", display: "block", lineHeight: "1.3" }}>
                {item.name}
              </strong>
              <span style={{ fontSize: "11px", color: "#0d4428", fontWeight: "700" }}>
                +₹{item.price.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* BUNDLE CTA FOOTER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "16px",
          borderTop: "1px solid #e5ede8",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Total for selected {selectedAccessories.length + 1} items:</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "20px", fontWeight: "900", color: "#0d4428" }}>
              ₹{finalDiscountedBundle.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "13px", textDecoration: "line-through", color: "#9ca3af" }}>
              ₹{totalBundlePrice.toLocaleString("en-IN")}
            </span>
            <span style={{ fontSize: "11.5px", color: "#15803d", fontWeight: "700" }}>
              (Save ₹{bundleSavings.toLocaleString("en-IN")})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddBundleToBag}
          disabled={selectedAccessories.length === 0 || addedBundle}
          className="btn-primary"
          style={{ padding: "10px 24px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {addedBundle ? (
            <>
              <CheckIcon size={16} /> ADDED PAIRING TO BAG
            </>
          ) : (
            <>
              <BagIcon size={16} /> ADD SELECTED PAIRING TO BAG
            </>
          )}
        </button>
      </div>
    </section>
  );
}
