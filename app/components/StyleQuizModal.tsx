"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SparklesIcon, CloseIcon, CheckIcon, ArrowRightIcon } from "@/app/components/Icons";

type StyleQuizProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (results: any) => void;
};

const QUIZ_QUESTIONS = [
  {
    id: "occasion",
    title: "What celebration are you styling for?",
    subtitle: "Select the primary event setting to tailor our haute couture silhouettes.",
    options: [
      { id: "bridal", label: "Grand Bridal Wedding", icon: "👑", desc: "Heavy zardozi embroidery & royal heritage lehengas" },
      { id: "sangeet", label: "Sangeet & Cocktails", icon: "✨", desc: "Contemporary drape lehengas, sequins & modern gowns" },
      { id: "reception", label: "Gala Reception / Soirée", icon: "🥂", desc: "Timeless Banarasi sarees & opulent velvet ensembles" },
      { id: "festive", label: "Festive & Intimate Puja", icon: "🪔", desc: "Graceful Anarkalis, pure georgette & organza suits" },
    ],
  },
  {
    id: "aesthetic",
    title: "Which aesthetic speaks to your persona?",
    subtitle: "We match embroidery techniques to your personal luxury taste.",
    options: [
      { id: "royal_heritage", label: "Royal Heritage & Zari", icon: "🏛️", desc: "Classic gold dabka, handwoven silk & traditional motifs" },
      { id: "modern_glamour", label: "Modern Glamour & Cut-Work", icon: "💎", desc: "Metallic accents, corset blousons & crystal work" },
      { id: "pastel_minimalist", label: "Pastel Couture & Florals", icon: "🌸", desc: "Soft blush tones, resham threadwork & dreamy tulle" },
      { id: "bold_regal", label: "Bold Jewel Tones", icon: "🍷", desc: "Deep emeralds, midnight blues & crimson velvet" },
    ],
  },
  {
    id: "silhouette",
    title: "What is your preferred silhouette & fit?",
    subtitle: "Calibrated for flattering proportions and bespoke draping.",
    options: [
      { id: "flared_lehenga", label: "Flared Kalidar Lehenga", icon: "👗", desc: "High flare with cancan structure and fitted choli" },
      { id: "traditional_saree", label: "Classic Drape Saree", icon: "🥻", desc: "Fluid 6-yard silhouette with statement designer blouse" },
      { id: "floor_length_anarkali", label: "Floor-Length Anarkali", icon: "✨", desc: "Flowing royal silhouette with churidar & heavy dupatta" },
      { id: "fusion_gown", label: "Contemporary Pre-Draped Set", icon: "🪞", desc: "Cape sets, shararas & effortless modern couture" },
    ],
  },
  {
    id: "palette",
    title: "Your signature celebratory color palette?",
    subtitle: "Curated to complement your skin undertone and lighting.",
    options: [
      { id: "emerald_gold", label: "Emerald Green & Royal Gold", icon: "🟢", desc: "Regal, sovereign and photogenic for nighttime galas" },
      { id: "crimson_ruby", label: "Crimson Red & Ruby", icon: "🔴", desc: "Auspicious, auspicious Indian wedding classic" },
      { id: "blush_ivory", label: "Blush Rose, Champagne & Ivory", icon: "🤍", desc: "Sun-drenched day weddings and pastel elegance" },
      { id: "sapphire_plum", label: "Midnight Sapphire & Deep Plum", icon: "🔵", desc: "High-contrast evening allure and contemporary glamour" },
    ],
  },
];

export default function StyleQuizModal({ isOpen, onClose, onComplete }: StyleQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [computing, setComputing] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQ = QUIZ_QUESTIONS[step];

  function handleSelectOption(optionId: string) {
    const updated = { ...answers, [currentQ.id]: optionId };
    setAnswers(updated);

    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step: compute persona
      setComputing(true);
      setTimeout(() => {
        setComputing(false);
        setCompleted(true);
        if (onComplete) onComplete(updated);
      }, 1200);
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setCompleted(false);
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
          maxWidth: "680px",
          background: "#ffffff",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          border: "1px solid #d4e2d8",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* TOP BAR */}
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
              AI Couture Style Consultation
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

        {/* PROGRESS BAR */}
        {!completed && (
          <div style={{ width: "100%", height: "4px", background: "#e5ede8" }}>
            <div
              style={{
                width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #c59b27, #f5d77f)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}

        {/* CONTENT */}
        <div style={{ padding: "32px", minHeight: "380px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {computing ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <SparklesIcon size={36} className="text-[#c59b27] animate-pulse" />
              </div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: 0 }}>
                Calibrating Your Royal Styling Persona...
              </h2>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "8px" }}>
                Matching handpicked silhouetting, embroidery density & drape geometry to your profile.
              </p>
            </div>
          ) : completed ? (
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#c59b27", letterSpacing: "1.5px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                YOUR BESPOKE COUTURE PERSONA
              </span>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", color: "#0d4428", margin: "0 0 10px" }}>
                The Sovereign Empress Profile
              </h2>
              <p style={{ fontSize: "13px", color: "#374151", maxWidth: "480px", margin: "0 auto 24px", lineHeight: "1.6" }}>
                Calibrated for grand celebrations with rich emerald and royal gold tones, hand-embroidered zardozi kalidar flares, and structured sweetheart corsetry.
              </p>

              {/* CURATED TAGS */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
                <span style={{ padding: "4px 12px", borderRadius: "20px", background: "#f0f7f3", color: "#0d4428", fontSize: "11.5px", fontWeight: "700", border: "1px solid #cce2d3" }}>
                  Kalidar Flare (Bust 36" | Waist 30")
                </span>
                <span style={{ padding: "4px 12px", borderRadius: "20px", background: "#faf4e1", color: "#854d0e", fontSize: "11.5px", fontWeight: "700", border: "1px solid #fef08a", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <SparklesIcon size={12} /> Zardozi & Dabka Embellishment
                </span>
                <span style={{ padding: "4px 12px", borderRadius: "20px", background: "#f0f7f3", color: "#0d4428", fontSize: "11.5px", fontWeight: "700", border: "1px solid #cce2d3" }}>
                  Emerald & Royal Gold Edit
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ padding: "10px 20px", borderRadius: "4px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                >
                  Retake Quiz
                </button>
                <Link
                  href="/shop?category=lehengas"
                  onClick={onClose}
                  className="btn-primary"
                  style={{ padding: "10px 28px", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  EXPLORE CURATED ENSEMBLES <ArrowRightIcon size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase" }}>
                  QUESTION {step + 1} OF {QUIZ_QUESTIONS.length}
                </span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", margin: "4px 0 6px", color: "var(--color-noir)" }}>
                  {currentQ.title}
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
                  {currentQ.subtitle}
                </p>
              </div>

              {/* OPTIONS GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      style={{
                        padding: "16px",
                        borderRadius: "8px",
                        border: isSelected ? "2px solid #0d4428" : "1px solid #e5e7eb",
                        background: isSelected ? "#f0f7f3" : "#fff",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: "24px", lineHeight: "1" }}>{opt.icon}</span>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#111827", display: "block", marginBottom: "2px" }}>
                          {opt.label}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#6b7280", lineHeight: "1.3", display: "block" }}>
                          {opt.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* BACK BUTTON */}
              {step > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    style={{ background: "transparent", border: "none", color: "#6b7280", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    ← Previous Question
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
