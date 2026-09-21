"use client";

import React, { useState } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import {
  BookOpenIcon,
  TagIcon,
  UploadCloudIcon,
  DownloadCloudIcon,
  FileSpreadsheetIcon,
  ReceiptIcon,
  PrinterIcon,
  TruckIcon,
  BarcodeScanIcon,
  ScaleIcon,
  RouteIcon,
  TargetIcon,
  CheckIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "@/app/components/Icons";

export default function AdminGuidebookPage() {
  const [activeSection, setActiveSection] = useState("quickstart");

  const sections = [
    { id: "quickstart", label: "Overview & Brand Identity", icon: <SparklesIcon size={15} /> },
    { id: "bulk-upload", label: "Bulk Product Catalog Upload (Excel / CSV)", icon: <UploadCloudIcon size={15} /> },
    { id: "banners", label: "Dynamic Hero Banners & Visuals", icon: <SparklesIcon size={15} /> },
    { id: "gst-invoices", label: "GST Tax Invoices & Order Dossiers", icon: <ReceiptIcon size={15} /> },
    { id: "wms", label: "Warehouse Management System (WMS)", icon: <TruckIcon size={15} /> },
    { id: "tracking", label: "Automated Tracking & Notifications", icon: <RouteIcon size={15} /> },
    { id: "meta-catalog", label: "Meta & Instagram Shopping Auto-Sync", icon: <TargetIcon size={15} /> },
  ];

  return (
    <AdminLayout
      title="Atelier Operations & Administration Guidebook"
      actions={
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              background: "#fff",
              border: "1px solid #0d4428",
              color: "#0d4428",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <PrinterIcon size={14} /> Print Guidebook
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        {/* HEADER HERO */}
        <div
          style={{
            background: "linear-gradient(135deg, #072818 0%, #0d4428 100%)",
            borderRadius: "10px",
            padding: "32px",
            color: "#ffffff",
            marginBottom: "24px",
            border: "1.5px solid #c59b27",
            boxShadow: "0 10px 30px rgba(7,40,24,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ background: "rgba(197,155,39,0.25)", color: "#f5d77f", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              OFFICIAL MANUAL & STANDARD OPERATING PROCEDURES (SOP)
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#f5d77f", margin: "4px 0 8px" }}>
            PQN Party Queen Operations Guidebook
          </h1>
          <p style={{ fontSize: "13px", color: "#d4e2d8", maxWidth: "780px", lineHeight: "1.6", margin: 0 }}>
            Complete standard operating procedures for catalog management, Excel/CSV bulk importing, Indian GST tax invoicing, regional warehouse hub geo-routing, barcode packing QC, and Meta/Instagram Shopping sync.
          </p>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px", alignItems: "start" }}>
          {/* SIDEBAR NAVIGATION */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "var(--shadow-xs)",
              position: "sticky",
              top: "20px",
            }}
          >
            <span style={{ fontSize: "10.5px", fontWeight: "800", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase", padding: "8px 12px", display: "block" }}>
              Guide Chapters
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: activeSection === sec.id ? "800" : "600",
                    border: "none",
                    background: activeSection === sec.id ? "#0d4428" : "transparent",
                    color: activeSection === sec.id ? "#f5d77f" : "#374151",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {sec.icon} {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTENT PANEL */}
          <div style={{ background: "#fff", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "32px", boxShadow: "var(--shadow-xs)" }}>
            {/* 1. QUICKSTART */}
            {activeSection === "quickstart" && (
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: "0 0 12px" }}>
                  1. Brand Identity & Platform Architecture
                </h2>
                <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.7", marginBottom: "20px" }}>
                  <strong>PQN Party Queen</strong> operates as a luxury Indian bridal and haute couture atelier. The digital platform is optimized for fast performance, custom luxury SVG iconography (no classic emojis), and adaptive responsive layouts across all mobile, tablet, desktop, and 4K widescreen displays.
                </p>

                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 10px", color: "#111827" }}>Design System Palette:</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                    <div style={{ background: "#0d4428", color: "#f5d77f", padding: "10px", borderRadius: "4px", fontSize: "11.5px", fontWeight: "700" }}>
                      Atelier Emerald (#0d4428)
                    </div>
                    <div style={{ background: "#c59b27", color: "#072818", padding: "10px", borderRadius: "4px", fontSize: "11.5px", fontWeight: "700" }}>
                      Royal Gold (#c59b27)
                    </div>
                    <div style={{ background: "#f6f8f6", color: "#111827", border: "1px solid #d4e2d8", padding: "10px", borderRadius: "4px", fontSize: "11.5px", fontWeight: "700" }}>
                      Ivory Base (#f6f8f6)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. BULK PRODUCT CATALOG UPLOAD */}
            {activeSection === "bulk-upload" && (
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: "0 0 12px" }}>
                  2. Bulk Product Catalog Upload (Excel / CSV)
                </h2>
                <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.7", marginBottom: "20px" }}>
                  You can upload hundreds of bridal lehengas, sarees, gowns, and jewelry pieces in a single batch using the pre-formatted Excel / CSV template.
                </p>

                <div style={{ border: "1.5px solid #c59b27", borderRadius: "8px", padding: "20px", background: "#fdfbf7", marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#072818", margin: "0 0 10px" }}>
                    Step-by-Step Instructions:
                  </h3>
                  <ol style={{ fontSize: "13px", color: "#4b5563", paddingLeft: "20px", lineHeight: "1.8" }}>
                    <li>Open <strong>Products Management</strong> (<code>/admin/products</code>).</li>
                    <li>Click <strong>&quot;Download Catalog Format (.csv)&quot;</strong> to get the standard spreadsheet template.</li>
                    <li>Open in Microsoft Excel or Google Sheets and fill in product title, category, price, sale price, SKU, stock count, sizes, colors, fabric, work, and photo URLs.</li>
                    <li>Click <strong>&quot;Upload Catalog (Excel / CSV)&quot;</strong> in the admin panel and drag-and-drop the file.</li>
                    <li>Inspect the live validation table and click <strong>&quot;Import &amp; Publish Products&quot;</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* 3. DYNAMIC HERO BANNERS */}
            {activeSection === "banners" && (
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: "0 0 12px" }}>
                  3. Dynamic Hero Banners &amp; Homepage Customization
                </h2>
                <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.7", marginBottom: "20px" }}>
                  Manage promotional hero campaigns, luxury video backgrounds, headline copy, and direct shop navigation buttons via <strong>Hero &amp; Banners</strong> (<code>/admin/banners</code>).
                </p>
                <div style={{ background: "#f0f7f3", border: "1px solid #cce2d3", borderRadius: "8px", padding: "18px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#0d4428", display: "block", marginBottom: "6px" }}>
                    Pro Tip:
                  </span>
                  <p style={{ fontSize: "12.5px", color: "#374151", margin: 0 }}>
                    For best visual luxury presentation on Retina &amp; 4K displays, upload banner images with a minimum resolution of <strong>2560 &times; 1440 px</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* 4. GST INVOICES */}
            {activeSection === "gst-invoices" && (
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: "0 0 12px" }}>
                  4. Indian GST Tax Invoicing &amp; Order Dossiers
                </h2>
                <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.7", marginBottom: "20px" }}>
                  All customer orders generate statutory Indian GST Tax Invoices (Original for Recipient) with distinct <strong>Billed To</strong> vs. <strong>Delivered To</strong> addresses and 6-digit PIN code auto-resolution.
                </p>
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", margin: "0 0 8px" }}>1-Click 3-in-1 Printable Dossier:</h3>
                  <ul style={{ fontSize: "12.5px", color: "#4b5563", paddingLeft: "18px", lineHeight: "1.8" }}>
                    <li><strong>Page 1:</strong> GST Tax Invoice with HSN code &amp; tax split.</li>
                    <li><strong>Page 2:</strong> Warehouse Packing Slip &amp; QC Checklist.</li>
                    <li><strong>Page 3:</strong> Courier Shipping Label with barcode.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 5. WMS */}
            {activeSection === "wms" && (
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: "0 0 12px" }}>
                  5. Warehouse Management System (WMS / OMS)
                </h2>
                <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.7", marginBottom: "20px" }}>
                  Located at <code>/admin/fulfillment</code>, the enterprise WMS suite features:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
                  <div style={{ border: "1px solid #d4e2d8", padding: "14px", borderRadius: "6px" }}>
                    <strong style={{ fontSize: "13px", color: "#0d4428", display: "block", marginBottom: "4px" }}>🗺️ Regional Hub Geo-Routing</strong>
                    <span style={{ fontSize: "12px", color: "#4b5563" }}>Auto-assigns orders to Delhi, Mumbai, BLR, or Kolkata hubs.</span>
                  </div>
                  <div style={{ border: "1px solid #d4e2d8", padding: "14px", borderRadius: "6px" }}>
                    <strong style={{ fontSize: "13px", color: "#0d4428", display: "block", marginBottom: "4px" }}>📋 Batch &amp; Wave Picking</strong>
                    <span style={{ fontSize: "12px", color: "#4b5563" }}>Sorted by Aisle, Bay, and Bin to minimize walking distance.</span>
                  </div>
                  <div style={{ border: "1px solid #d4e2d8", padding: "14px", borderRadius: "6px" }}>
                    <strong style={{ fontSize: "13px", color: "#0d4428", display: "block", marginBottom: "4px" }}>🔍 Barcode QC Station</strong>
                    <span style={{ fontSize: "12px", color: "#4b5563" }}>Garment tag barcode verification &amp; volumetric weight validator.</span>
                  </div>
                  <div style={{ border: "1px solid #d4e2d8", padding: "14px", borderRadius: "6px" }}>
                    <strong style={{ fontSize: "13px", color: "#0d4428", display: "block", marginBottom: "4px" }}>🚚 Rate Shopping</strong>
                    <span style={{ fontSize: "12px", color: "#4b5563" }}>Compares Blue Dart, Delhivery, Shiprocket &amp; DTDC freight.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. TRACKING */}
            {activeSection === "tracking" && (
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: "0 0 12px" }}>
                  6. Automated Order Tracking &amp; Notifications
                </h2>
                <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.7", marginBottom: "20px" }}>
                  Whenever an order status changes (<strong>CONFIRMED ➔ PROCESSING ➔ SHIPPED ➔ DELIVERED</strong>), the customer receives an instant milestone email with their Air Waybill (AWB #) and 1-click Satellite Radar transit link.
                </p>
                <div style={{ background: "#f0f7f3", border: "1px solid #cce2d3", borderRadius: "8px", padding: "18px" }}>
                  <strong style={{ fontSize: "13px", color: "#0d4428", display: "block", marginBottom: "6px" }}>Live Customer Tracker:</strong>
                  <span style={{ fontSize: "12.5px", color: "#374151" }}>
                    Customers can track their orders anytime at <code>/track-order?order=PQN-XXXX</code> and access their 7-day digital return QR code.
                  </span>
                </div>
              </div>
            )}

            {/* 7. META CATALOG */}
            {activeSection === "meta-catalog" && (
              <div>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#0d4428", margin: "0 0 12px" }}>
                  7. Meta Pixel &amp; Instagram Shopping Auto-Sync Feeds
                </h2>
                <p style={{ fontSize: "13.5px", color: "#374151", lineHeight: "1.7", marginBottom: "20px" }}>
                  The website automatically generates live product feeds for Meta Commerce Manager and Instagram Shopping.
                </p>
                <div style={{ background: "#faf8f7", border: "1.5px solid #c59b27", borderRadius: "8px", padding: "18px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#072818", display: "block", marginBottom: "6px" }}>
                    Primary XML Feed URL:
                  </span>
                  <code style={{ background: "#fff", padding: "6px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "12px", display: "block", color: "#0d4428", fontFamily: "monospace" }}>
                    https://pqnpartyqueen.com/api/feeds/meta
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
