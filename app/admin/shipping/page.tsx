"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminLayout from "@/app/components/AdminLayout";
import ShippingProviderManager from "@/app/components/admin/ShippingProviderManager";
import {
  TruckIcon,
  PackageIcon,
  CheckIcon,
  ShieldCheckIcon,
  SettingsIcon,
  SparklesIcon,
  RefreshCwIcon,
  LayersIcon,
} from "@/app/components/Icons";

export default function AdminShippingPage() {
  const [activeSubTab, setActiveSubTab] = useState<"providers" | "quicklinks">("providers");
  const [authChecking, setAuthChecking] = useState(true);

  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/shipping/providers");
        if (res.status === 401) {
          window.location.href = "/admin/login?next=/admin/shipping";
          return;
        }
      } catch {
        // ignore
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  return (
    <AdminLayout
      title="Automatic Shipping & Multi-Carrier Hub"
      subtitle="Configure real-time courier rate comparison, automated dispatch, AWB generation, and live GPS milestone tracking across Blue Dart, Delhivery, DTDC, Shiprocket, NimBusPost, and ShipMozo."
      actions={
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            href="/admin/fulfillment"
            style={{
              padding: "8px 16px",
              borderRadius: "5px",
              background: "#ffffff",
              color: "#0d4428",
              border: "1px solid #cce2d3",
              fontSize: "12px",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LayersIcon size={14} /> WMS Fulfillment Queue
          </Link>
          <Link
            href="/admin/orders"
            style={{
              padding: "8px 16px",
              borderRadius: "5px",
              background: "#0d4428",
              color: "#f5d77f",
              border: "1px solid #c59b27",
              fontSize: "12px",
              fontWeight: "700",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <PackageIcon size={14} /> View Orders to Dispatch
          </Link>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1350px", margin: "0 auto" }}>
        {/* TOP STATUS HERO BANNER */}
        <div
          style={{
            background: "linear-gradient(135deg, #0d4428 0%, #082a19 100%)",
            border: "1px solid #c59b27",
            borderRadius: "10px",
            padding: "24px 28px",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            boxShadow: "0 8px 24px rgba(13, 68, 40, 0.2)",
          }}
        >
          <div style={{ maxWidth: "700px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "10.5px", fontWeight: "800", background: "#f5d77f", color: "#072818", padding: "2px 8px", borderRadius: "12px", letterSpacing: "1px", textTransform: "uppercase" }}>
                AI RATE SHOPPING ACTIVE
              </span>
              <span style={{ fontSize: "11px", color: "#bbf7d0", fontWeight: "600" }}>
                &bull; 29,000+ Indian Pincodes Covered
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", margin: "0 0 6px 0", color: "#ffffff" }}>
              Automated Multi-Carrier Shipping Engine
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#d1fae5", lineHeight: "1.5" }}>
              The system queries Blue Dart Express, Delhivery Air, DTDC Prime, and Shiprocket smart aggregator to compare rates, SLA transit times, and COD availability for every customer order.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", color: "#f5d77f", letterSpacing: "0.5px", display: "block" }}>DISPATCH ORIGIN</span>
              <strong style={{ fontSize: "13px", color: "#fff" }}>Connaught Place, New Delhi</strong>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "12px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", textAlign: "center" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", color: "#f5d77f", letterSpacing: "0.5px", display: "block" }}>SUPPORTED MODES</span>
              <strong style={{ fontSize: "13px", color: "#fff" }}>Air Express & Surface</strong>
            </div>
          </div>
        </div>

        {/* EMBEDDED COMPLETE SHIPPING PROVIDER MANAGER */}
        <ShippingProviderManager />
      </div>
    </AdminLayout>
  );
}
