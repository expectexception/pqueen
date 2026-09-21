"use client";

import React, { useState } from "react";
import { SparklesIcon, CloseIcon, ArrowRightIcon, BotIcon } from "@/app/components/Icons";

export default function FloatingAiConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    {
      sender: "bot",
      text: "Namaste! Welcome to PQN Party Queen Haute Couture. I am your AI Styling & Sizing Concierge. How may I assist your wardrobe selection today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = "Our master tailors recommend checking our bespoke sizing chart. For custom blouse necklines and lehenga length alterations, complimentary bespoke fitting is available on all orders!";
      const lower = userMsg.toLowerCase();

      if (lower.includes("size") || lower.includes("fit") || lower.includes("bust") || lower.includes("waist")) {
        reply = "For bridal lehengas, we recommend ordering according to your bust and high-waist measurement in inches. All PQN ensembles include 2-inch inner side margins for effortless alterations!";
      } else if (lower.includes("track") || lower.includes("order") || lower.includes("status")) {
        reply = "You can track your real-time Blue Dart Air Express transit anytime on our Live Satellite Tracker at /track-order with your Order Reference Number!";
      } else if (lower.includes("fabric") || lower.includes("silk") || lower.includes("velvet") || lower.includes("material")) {
        reply = "Our Pure Katan Banarasi Silks are handwoven with gold zari motifs for grand receptions, while our French Micro-Velvet lehengas offer opulent structure for winter weddings.";
      } else if (lower.includes("return") || lower.includes("exchange")) {
        reply = "We offer a 7-day complimentary doorstep exchange guarantee. You can also generate an instant digital Return QR Code without printing any labels!";
      }

      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 1000);
  }

  return (
    <div className="no-print" style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999 }}>
      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "64px",
            right: "0",
            width: "360px",
            height: "480px",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px solid rgba(197, 155, 39, 0.4)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(197, 155, 39, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #c59b27, #f5d77f)", color: "#072818", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SparklesIcon size={16} />
              </div>
              <div>
                <strong style={{ fontSize: "13px", color: "#f5d77f", display: "block" }}>PQN AI Styling Concierge</strong>
                <span style={{ fontSize: "10.5px", color: "#e6f0ea" }}>● Online &bull; Instant Sizing Guide</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }}
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* MESSAGES LIST */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", background: "#fafaf9" }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: m.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.sender === "user" ? "#0d4428" : "#ffffff",
                  color: m.sender === "user" ? "#ffffff" : "#1c1917",
                  fontSize: "12.5px",
                  lineHeight: "1.45",
                  border: m.sender === "bot" ? "1px solid #e5ede8" : "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {m.text}
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: "flex-start", padding: "8px 12px", background: "#fff", borderRadius: "12px", fontSize: "11px", color: "#6b7280" }}>
                AI Stylist is typing...
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <form onSubmit={handleSend} style={{ padding: "10px", background: "#fff", borderTop: "1px solid #e5ede8", display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Ask about sizing, fabrics, drape..."
              style={{ fontSize: "12px", padding: "8px 12px" }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              style={{
                padding: "0 14px",
                borderRadius: "4px",
                background: "#0d4428",
                color: "#f5d77f",
                border: "none",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* FLOATING BOT LOGO BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close AI Stylist" : "Open AI Stylist Concierge"}
        title="AI Stylist Concierge"
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
          color: "#f5d77f",
          border: "1.5px solid #c59b27",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 22px rgba(7, 40, 24, 0.45)",
          position: "relative",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "scale(1.08) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 28px rgba(197, 155, 39, 0.45)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 22px rgba(7, 40, 24, 0.45)";
        }}
      >
        {isOpen ? (
          <CloseIcon size={20} />
        ) : (
          <>
            <BotIcon size={24} strokeWidth={1.8} />
            {/* Live Online Pulse Dot */}
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "11px",
                height: "11px",
                borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #072818",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
          </>
        )}
      </button>
    </div>
  );
}
