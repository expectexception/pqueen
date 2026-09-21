"use client";

import React, { useState } from "react";
import StyleQuizModal from "@/app/components/StyleQuizModal";
import Link from "next/link";
import { SparklesIcon, ArrowRightIcon } from "@/app/components/Icons";

export default function StyleQuizPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8f7f5]">

      <main className="section-wrapper" style={{ maxWidth: "800px", padding: "60px 6% 100px", textAlign: "center" }}>
        <div style={{ padding: "40px", background: "#fff", borderRadius: "8px", border: "1px solid #d4e2d8", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0f7f3", color: "#0d4428", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <SparklesIcon size={24} />
          </div>

          <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", color: "var(--brand-rose)", textTransform: "uppercase" }}>
            AI HAUTE COUTURE CONSULTATION
          </span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "32px", margin: "8px 0 12px", color: "var(--color-noir)" }}>
            Discover Your Signature Royal Aesthetic
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", maxWidth: "520px", margin: "0 auto 28px", lineHeight: "1.6" }}>
            Answer 4 quick styling questions to calibrate your personalized silhouette, event color palette, and bespoke embroidery recommendations.
          </p>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="btn-primary"
            style={{ padding: "14px 36px", fontSize: "13px" }}
          >
            START COUTURE CONSULTATION <SparklesIcon size={16} />
          </button>
        </div>
      </main>

      <StyleQuizModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
