"use client";

import React, { useState, useEffect } from "react";
import {
  TruckIcon,
  CheckIcon,
  DownloadCloudIcon,
  RefreshCwIcon,
  PackageIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@/app/components/Icons";

interface Props {
  order: any;
  onOrderUpdated: () => void;
}

export default function OrderShippingActionCard({ order, onOrderUpdated }: Props) {
  const [loadingRates, setLoadingRates] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isShipped = order.status === "SHIPPED" || order.status === "DELIVERED";
  const awb = order.awbNumber || order.trackingNumber;

  useEffect(() => {
    if (!isShipped) {
      fetchLiveQuotes();
    } else if (awb) {
      fetchTracking();
    }
  }, [order.id, isShipped, awb]);

  async function fetchLiveQuotes() {
    try {
      setLoadingRates(true);
      const res = await fetch("/api/admin/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryPincode: order.shippingPincode || "110059",
          weightKg: 0.8,
          isCod: (order.paymentMethod || "").toUpperCase() === "COD",
          orderValue: parseFloat(order.totalAmount) || 2990,
        }),
      });
      const data = await res.json();
      if (data.success && data.quotes) {
        setQuotes(data.quotes);
        if (data.recommendedQuote) {
          setSelectedCourier(data.recommendedQuote);
        } else if (data.quotes.length > 0) {
          setSelectedCourier(data.quotes[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    } finally {
      setLoadingRates(false);
    }
  }

  async function handleDispatch(courierToUse?: any) {
    const courier = courierToUse || selectedCourier;
    try {
      setDispatching(true);
      setMessage(null);

      const res = await fetch("/api/admin/shipping/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          providerId: courier?.providerId || "ithink",
          courierId: courier?.courierId,
          courierName: courier?.courierName || "Delhivery Surface & Express (iThink)",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Shipment dispatch failed");
      }

      setMessage({
        type: "success",
        text: `Shipment created successfully via ${data.shipment?.courierName || 'carrier'}! AWB: ${data.shipment?.awbNumber}`,
      });

      onOrderUpdated();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to create shipment with carrier",
      });
    } finally {
      setDispatching(false);
    }
  }

  async function fetchTracking() {
    if (!awb) return;
    try {
      setLoadingTracking(true);
      const res = await fetch(`/api/admin/shipping/shipments/${order.id}/track`);
      const data = await res.json();
      if (data.success && data.tracking) {
        setTrackingData(data.tracking);
      }
    } catch (err) {
      console.error("Tracking fetch error:", err);
    } finally {
      setLoadingTracking(false);
    }
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid var(--border-subtle)",
        borderRadius: "8px",
        padding: "24px",
        marginTop: "20px",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#f0f7f3",
              color: "#0d4428",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TruckIcon size={20} />
          </div>
          <div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "17px", margin: 0, color: "#0d4428" }}>
              Multi-Provider Courier Dispatch & Live Tracking
            </h3>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Automated rate comparison, AWB allocation, label generation & carrier tracking
            </span>
          </div>
        </div>

        {isShipped && awb && (
          <button
            type="button"
            onClick={fetchTracking}
            disabled={loadingTracking}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              fontSize: "11.5px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <RefreshCwIcon size={12} /> {loadingTracking ? "Refreshing..." : "Refresh Live Tracking"}
          </button>
        )}
      </div>

      {message && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            fontSize: "12.5px",
            fontWeight: "700",
            marginBottom: "16px",
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#15803d" : "#b91c1c",
          }}
        >
          {message.type === "success" ? "✓ " : "✕ "} {message.text}
        </div>
      )}

      {order.shippingError && !message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "6px",
            fontSize: "12.5px",
            fontWeight: "600",
            marginBottom: "16px",
            background: "#fff1f2",
            border: "1px solid #fecdd3",
            color: "#9f1239",
          }}
        >
          <strong style={{ display: "block", marginBottom: "2px" }}>⚠️ iThink Logistics Push Notice:</strong>
          {order.shippingError}
        </div>
      )}

      {/* VIEW FOR SHIPPED ORDER */}
      {isShipped ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              padding: "14px",
              background: "#f8fafc",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                Courier Carrier
              </span>
              <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                {order.courierName || order.carrier || "Delhivery Surface & Express (iThink)"}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                Air Waybill (AWB)
              </span>
              <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0d4428", marginTop: "2px", letterSpacing: "0.5px" }}>
                {awb || "Generating..."}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                Current Status
              </span>
              <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#166534", marginTop: "2px" }}>
                {trackingData?.statusText || "In Transit via iThink"}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                Destination PIN
              </span>
              <div style={{ fontSize: "13.5px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                {order.shippingPincode || "110059"}
              </div>
            </div>
          </div>

          {/* OFFICIAL ITHINK LABEL & TRACKING ACTIONS */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <a
              href={order.shippingLabelUrl || `https://my.ithinklogistics.com/print_label?awb=${awb}`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                background: "#0d4428",
                border: "1px solid #c59b27",
                color: "#f5d77f",
                fontSize: "12px",
                fontWeight: "800",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <DownloadCloudIcon size={14} /> Download Official iThink Courier Label (PDF) ↗
            </a>

            <a
              href={order.trackingUrl || `https://my.ithinklogistics.com/track?awb=${awb}`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                fontSize: "12px",
                fontWeight: "700",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <TruckIcon size={14} /> View Live Carrier Tracking ↗
            </a>
          </div>

          {/* TRACKING TIMELINE */}
          {trackingData?.events && trackingData.events.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <h4 style={{ fontSize: "12.5px", fontWeight: "800", margin: "0 0 10px", color: "#334155" }}>
                Carrier Milestone Journey
              </h4>
              <div style={{ borderLeft: "2px solid #0d4428", paddingLeft: "14px", marginLeft: "6px" }}>
                {trackingData.events.map((evt: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: "12px", position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "-19px",
                        top: "2px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: idx === 0 ? "#0d4428" : "#94a3b8",
                      }}
                    />
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>
                      {evt.activity || evt.status}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {new Date(evt.timestamp).toLocaleString("en-IN")} {evt.location ? `• ${evt.location}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW FOR UNSHIPPED ORDER: RATE SHOPPING & COURIER DISPATCH */
        <div>
          <div style={{ marginBottom: "12px", fontSize: "12.5px", color: "#475569" }}>
            Destination: <strong>{order.shippingCity || "City"}, {order.shippingState || "State"} - {order.shippingPincode || "400001"}</strong>
          </div>

          {loadingRates ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
              Calculating live courier quotes across providers...
            </div>
          ) : quotes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>
                Available Carrier Services:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
                {quotes.map((q, idx) => {
                  const isSelected = selectedCourier?.courierId === q.courierId && selectedCourier?.providerId === q.providerId;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCourier(q)}
                      style={{
                        border: `1.5px solid ${isSelected ? "#0d4428" : "#e2e8f0"}`,
                        background: isSelected ? "#f0fdf4" : "#ffffff",
                        borderRadius: "6px",
                        padding: "12px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "13px", color: "#0f172a" }}>{q.courierName}</strong>
                          <span style={{ fontSize: "10.5px", fontWeight: "700", color: "#0d4428", background: "#dcfce7", padding: "2px 6px", borderRadius: "10px" }}>
                            {q.providerName}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                          Est. Delivery: <strong>{q.estimatedDeliveryDays} Days</strong> ({q.serviceType.toUpperCase()})
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Total Cost:</span>
                        <strong style={{ fontSize: "14px", color: "#0d4428" }}>₹{q.totalCharge}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => handleDispatch()}
                  disabled={dispatching || !selectedCourier}
                  className="btn-primary"
                  style={{
                    padding: "10px 24px",
                    fontSize: "12.5px",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                  }}
                >
                  {dispatching
                    ? "GENERATING AWB & DISPATCHING..."
                    : `SHIP VIA ${(selectedCourier?.courierName || 'SELECTED COURIER').toUpperCase()} NOW`}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                Default automatic dispatch using PQN Luxury Express:
              </span>
              <button
                type="button"
                onClick={() => handleDispatch({ providerId: "manual", courierName: "PQN Express Logistics" })}
                disabled={dispatching}
                className="btn-primary"
                style={{ padding: "8px 18px", fontSize: "12px" }}
              >
                {dispatching ? "GENERATING AWB..." : "DISPATCH & GENERATE AWB"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
