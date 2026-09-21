"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PackageIcon,
  SearchIcon,
  ArrowRightIcon,
  TruckIcon,
  CheckIcon,
  ShieldCheckIcon,
  BarcodeScanIcon,
  WhatsAppIcon,
  RadarIcon,
  HomeIcon,
  WarningIcon,
  DeliveryIcon,
} from "@/app/components/Icons";
import { evaluateReturnEligibility } from "@/lib/return-policy";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || "PQN-7841";

  const [orderInput, setOrderInput] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState("");
  const [showReturnQR, setShowReturnQR] = useState(false);

  async function performTrack(orderNum: string) {
    if (!orderNum.trim()) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/track-order/${encodeURIComponent(orderNum.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Shipment could not be found.");
      }

      setOrderData(data.order);
    } catch (err: any) {
      setError(err.message || "Failed to locate shipment.");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialOrder) {
      performTrack(initialOrder);
    }
  }, [initialOrder]);

  function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault();
    performTrack(orderInput);
  }

  return (
    <div className="min-h-screen bg-[#f8f7f5]">

      <main className="section-wrapper" style={{ maxWidth: "920px", padding: "40px 5% 100px" }}>
        <div className="section-heading" style={{ marginBottom: "28px", textAlign: "center" }}>
          <span className="section-eyebrow">LIVE SATELLITE COURIER RADAR</span>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(22px,5vw,32px)", margin: "6px 0" }}>
            Track Your Haute Couture Shipment
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            Enter your PQN Order Number to track real-time delivery status, courier vehicle transit, and Indian logistics dispatch.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div style={{ background: "#fff", border: "1px solid #d4e2d8", borderRadius: "8px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: "32px" }}>
          <form onSubmit={handleTrackSubmit} className="track-search-form">
            <input
              type="text"
              className="form-input"
              placeholder="e.g. PQN-7841 or Order ID"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              required
              style={{ flex: 1, fontSize: "14px", fontWeight: "700" }}
            />
            <button type="submit" disabled={loading} className="btn-primary track-search-btn" style={{ padding: "0 28px", flexShrink: 0, fontSize: "12px", letterSpacing: "1px" }}>
              {loading ? "SEARCHING..." : "TRACK SHIPMENT"} <SearchIcon size={16} />
            </button>
          </form>

          {error && (
            <div style={{ marginTop: "12px", color: "#991b1b", fontSize: "12.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              <WarningIcon size={14} style={{ color: "#991b1b", flexShrink: 0 }} /> {error}
            </div>
          )}
        </div>

        {/* TRACKING REPORT */}
        {orderData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. TOP STATUS CARD */}
            <div style={{ background: "#fff", border: "1px solid #d4e2d8", borderRadius: "8px", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              {/* TOP STRIP */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5ede8", paddingBottom: "18px", marginBottom: "24px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase" }}>
                    {orderData.logistics.carrier} PRIORITY
                  </span>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#111827", marginTop: "2px" }}>
                    Order #{orderData.orderNumber} &bull; AWB: {orderData.logistics.awb}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ padding: "5px 14px", borderRadius: "20px", background: orderData.status === "DELIVERED" ? "#dcfce7" : "#fef3c7", color: orderData.status === "DELIVERED" ? "#15803d" : "#92400e", fontSize: "12px", fontWeight: "800" }}>
                    ● {orderData.status}
                  </span>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                    SLA: <strong>{orderData.logistics.estimatedDays}</strong>
                  </div>
                </div>
              </div>

              {/* VISUAL TRANSIT MAP ROUTE */}
              <div style={{ padding: "20px 0 32px" }}>
                <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {/* Progress Line */}
                  <div style={{ position: "absolute", left: "40px", right: "40px", top: "20px", height: "4px", background: "#e5ede8", zIndex: 1 }}>
                    <div style={{ width: orderData.status === "DELIVERED" ? "100%" : orderData.status === "SHIPPED" ? "75%" : "40%", height: "100%", background: "linear-gradient(90deg, #0d4428, #c59b27)" }} />
                  </div>

                  {/* Step 1: Atelier QC */}
                  <div style={{ zIndex: 2, textAlign: "center", width: "120px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0d4428", color: "#f5d77f", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: "0 2px 8px rgba(13,68,40,0.3)" }}>
                      <CheckIcon size={18} />
                    </div>
                    <strong style={{ fontSize: "12px", color: "#111827", display: "block" }}>Atelier QC</strong>
                    <span style={{ fontSize: "10.5px", color: "#6b7280" }}>New Delhi (Passed)</span>
                  </div>

                  {/* Step 2: In Air Transit */}
                  <div style={{ zIndex: 2, textAlign: "center", width: "120px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0d4428", color: "#f5d77f", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: "0 2px 8px rgba(13,68,40,0.3)" }}>
                      <TruckIcon size={18} />
                    </div>
                    <strong style={{ fontSize: "12px", color: "#111827", display: "block" }}>In Air Transit</strong>
                    <span style={{ fontSize: "10.5px", color: "#6b7280" }}>Hub: {orderData.logistics.hubCode}</span>
                  </div>

                  {/* Step 3: Out for Delivery */}
                  <div style={{ zIndex: 2, textAlign: "center", width: "120px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: orderData.status === "DELIVERED" ? "#0d4428" : "#c59b27", color: orderData.status === "DELIVERED" ? "#f5d77f" : "#072818", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", boxShadow: "0 0 0 4px rgba(197,155,39,0.25)" }}>
                      <DeliveryIcon size={18} />
                    </div>
                    <strong style={{ fontSize: "12px", color: "#0d4428", display: "block" }}>Out for Delivery</strong>
                    <span style={{ fontSize: "10.5px", color: "#15803d", fontWeight: "700" }}>Courier Van en route</span>
                  </div>

                  {/* Step 4: Doorstep Delivery */}
                  <div style={{ zIndex: 2, textAlign: "center", width: "120px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: orderData.status === "DELIVERED" ? "#0d4428" : "#e5ede8", color: orderData.status === "DELIVERED" ? "#f5d77f" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <HomeIcon size={18} />
                    </div>
                    <strong style={{ fontSize: "12px", color: orderData.status === "DELIVERED" ? "#0d4428" : "#9ca3af", display: "block" }}>Doorstep Delivery</strong>
                    <span style={{ fontSize: "10.5px", color: "#9ca3af" }}>{orderData.shippingCity}</span>
                  </div>
                </div>
              </div>

              {/* DELIVERED TO ADDRESS CARD */}
              <div className="track-address-grid" style={{ background: "#f8faf9", padding: "18px 20px", borderRadius: "6px", border: "1px solid #d4e2d8", marginBottom: "20px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <TruckIcon size={12} /> DELIVERED TO / DESTINATION:
                  </span>
                  <strong style={{ fontSize: "14px", color: "#111827" }}>{orderData.shippingName}</strong>
                  <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px", lineHeight: "1.4" }}>
                    {orderData.shippingAddress}<br />
                    {orderData.shippingCity}, {orderData.shippingState} - {orderData.shippingPincode}<br />
                    State Code: <strong>{orderData.stateCode} ({orderData.shippingState})</strong>
                  </div>
                </div>

                <div style={{ borderLeft: "1px solid #e5ede8", paddingLeft: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                    <PackageIcon size={13} /> ENSEMBLES IN PARCEL ({orderData.itemsCount} Items):
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                    {orderData.items.map((it: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#374151" }}>
                        <span>&bull; {it.productName} ({it.size || "Standard"}) &times; {it.quantity}</span>
                        <strong>₹{it.price.toLocaleString("en-IN")}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5-DAY RETURN POLICY & COURIER ACTIONS */}
              {(() => {
                const returnCheck = orderData.returnEligibility || evaluateReturnEligibility(orderData);
                const isDelivered = orderData.status === "DELIVERED";

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#f6f9f7", padding: "18px 20px", borderRadius: "6px", border: "1px solid #d4e2d8" }}>
                    {/* Return Policy Status Banner */}
                    {isDelivered && (
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: "6px",
                          background: returnCheck.isEligible ? "#ecfdf5" : "#fef2f2",
                          border: returnCheck.isEligible ? "1px solid #a7f3d0" : "1px solid #fecaca",
                          color: returnCheck.isEligible ? "#065f46" : "#991b1b",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {returnCheck.isEligible ? <ShieldCheckIcon size={16} /> : <WarningIcon size={16} />}
                          <span>{returnCheck.message}</span>
                        </div>
                        {returnCheck.isEligible && (
                          <span style={{ fontSize: "11px", fontWeight: "800", background: "#059669", color: "#fff", padding: "2px 8px", borderRadius: "12px" }}>
                            {returnCheck.daysRemaining} DAY{returnCheck.daysRemaining > 1 ? "S" : ""} LEFT
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <strong style={{ fontSize: "13px", color: "#111827" }}>Carrier: {orderData.logistics.carrier}</strong>
                        <div style={{ fontSize: "11.5px", color: "#4b5563" }}>Route: {orderData.logistics.hubCode} &bull; Insured Express Delivery</div>
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        {isDelivered && returnCheck.isEligible ? (
                          <button
                            type="button"
                            onClick={() => setShowReturnQR(true)}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "4px",
                              background: "#fff",
                              border: "1px solid #0d4428",
                              color: "#0d4428",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <BarcodeScanIcon size={14} /> One-Tap Return QR Pass
                          </button>
                        ) : isDelivered && returnCheck.isExpired ? (
                          <button
                            type="button"
                            disabled
                            title="Return window expired. Orders can only be returned within 5 days of delivery."
                            style={{
                              padding: "8px 14px",
                              borderRadius: "4px",
                              background: "#f3f4f6",
                              border: "1px solid #d1d5db",
                              color: "#9ca3af",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              cursor: "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <BarcodeScanIcon size={14} /> Return Window Expired
                          </button>
                        ) : null}

                        <a
                          href="https://wa.me/919876543210"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "8px 16px",
                            borderRadius: "4px",
                            background: "#15803d",
                            color: "#fff",
                            fontSize: "11.5px",
                            fontWeight: "700",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <WhatsAppIcon size={14} /> WhatsApp Courier Support
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ONE-TAP RETURN QR MODAL */}
        {showReturnQR && (
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
              if (e.target === e.currentTarget) setShowReturnQR(false);
            }}
          >
            <div style={{ width: "100%", maxWidth: "440px", background: "#fff", borderRadius: "8px", padding: "28px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#0d4428", letterSpacing: "1px", textTransform: "uppercase" }}>
                5-DAY DOORSTEP RETURN &amp; EXCHANGE
              </span>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", margin: "6px 0 12px" }}>
                Digital Return &amp; Size Exchange QR
              </h2>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
                Show this barcode to the courier representative when they arrive at your doorstep within the active 5-day return window. No printer or physical label needed!
              </p>

              {/* QR CODE BOX */}
              <div style={{ background: "#f8faf9", border: "2px solid #0d4428", borderRadius: "6px", padding: "20px", width: "200px", height: "200px", margin: "0 auto 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", width: "120px", height: "120px", background: "#0d4428", padding: "8px", borderRadius: "4px" }}>
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} style={{ background: i % 2 === 0 ? "#fff" : "transparent", borderRadius: "1px" }} />
                  ))}
                </div>
                <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "700", marginTop: "8px" }}>
                  RET-{orderData?.orderNumber || "7841"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowReturnQR(false)}
                className="btn-primary"
                style={{ width: "100%", padding: "12px", fontSize: "12px" }}
              >
                CLOSE DIGITAL PASS
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px 20px", textAlign: "center" }}>Initializing Haute Couture Tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
