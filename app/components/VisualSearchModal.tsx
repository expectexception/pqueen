"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SearchIcon, CloseIcon, SparklesIcon, ArrowRightIcon, CameraIcon } from "@/app/components/Icons";

type VisualSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function VisualSearchModal({ isOpen, onClose }: VisualSearchModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [matches, setMatches] = useState<any[] | null>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setScanning(true);
      setMatches(null);

      // Simulate AI visual recognition matching
      setTimeout(() => {
        setScanning(false);
        setMatches([
          {
            name: "Royal Emerald Hand-Embroidered Zardozi Lehenga",
            category: "Bridal Lehengas",
            price: 48999,
            image: "/logopq.png",
            slug: "royal-emerald-zardozi-lehenga",
            similarity: "98% Match",
          },
          {
            name: "Heritage Banarasi Gold Kadwa Silk Saree",
            category: "Heritage Sarees",
            price: 24999,
            image: "/logopq.png",
            slug: "heritage-banarasi-gold-saree",
            similarity: "94% Match",
          },
          {
            name: "Velvet Midnight Anarkali Ensemble with Zari Border",
            category: "Royal Suits",
            price: 18999,
            image: "/logopq.png",
            slug: "velvet-midnight-anarkali",
            similarity: "89% Match",
          },
        ]);
      }, 1500);
    }
  }

  function handleReset() {
    setImagePreview(null);
    setScanning(false);
    setMatches(null);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(7, 40, 24, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "#ffffff",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          border: "1px solid #d4e2d8",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 24px",
            background: "linear-gradient(180deg, #072818 0%, #0a3320 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(197, 155, 39, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SparklesIcon size={18} className="text-[#f5d77f]" />
            <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "1.5px", color: "#f5d77f", textTransform: "uppercase" }}>
              AI Visual Image Search
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#e6f0ea", cursor: "pointer" }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "28px" }}>
          {!imagePreview ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                  <CameraIcon size={38} className="text-[#0d4428]" />
                </div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "#0d4428", margin: 0 }}>
                  Upload a Photo to Find Matching Outfits
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: "6px 0 0" }}>
                  Upload an Instagram screenshot, wedding moodboard, or inspiration photo to discover matching lehengas & sarees.
                </p>
              </div>

              <label
                style={{
                  display: "block",
                  padding: "36px 20px",
                  border: "2px dashed #0d4428",
                  borderRadius: "8px",
                  background: "#f0f7f3",
                  cursor: "pointer",
                  margin: "20px 0 10px",
                }}
              >
                <div style={{ color: "#0d4428", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>
                  Click to Browse or Drop Photo Here
                </div>
                <span style={{ color: "#4b5563", fontSize: "11px" }}>Supports JPG, PNG, WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          ) : (
            <div>
              {/* PREVIEW + SCANNING HEADER */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", padding: "12px", background: "#f6f9f7", borderRadius: "6px", border: "1px solid #d4e2d8" }}>
                <img
                  src={imagePreview}
                  alt="Search query"
                  style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid #cce2d3" }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#0d4428", textTransform: "uppercase" }}>
                    {scanning ? "AI Analyzing Embroidery & Palette..." : "Visual Recognition Results"}
                  </span>
                  <p style={{ fontSize: "12px", color: "#4b5563", margin: "2px 0 0" }}>
                    {scanning ? "Scanning neckline, drape silhouette, and zari density" : "Matched silhouettes from PQN Party Queen Couture collection"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "11px", cursor: "pointer" }}
                >
                  Change Photo
                </button>
              </div>

              {/* MATCHES LIST */}
              {scanning ? (
                <div style={{ padding: "30px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                    <SparklesIcon size={28} className="text-[#c59b27] animate-pulse" />
                  </div>
                  <h3 style={{ fontSize: "15px", color: "#0d4428", margin: 0 }}>Matching Atelier Designs...</h3>
                </div>
              ) : matches ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {matches.map((item, idx) => (
                    <Link
                      key={idx}
                      href={`/shop/${item.slug}`}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-subtle)",
                        background: "#fff",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "4px", background: "#072818", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div>
                          <strong style={{ fontSize: "13px", color: "var(--color-noir)", display: "block" }}>
                            {item.name}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                            {item.category} &bull; <strong style={{ color: "#0d4428" }}>{item.similarity}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#0d4428" }}>
                          ₹{item.price.toLocaleString("en-IN")}
                        </div>
                        <span style={{ fontSize: "11px", color: "#c59b27", fontWeight: "700" }}>View Ensemble →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
